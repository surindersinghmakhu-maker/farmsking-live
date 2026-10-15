import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AdminWebPortalScreen from './admin';
import { useAuth } from '@/src/store/auth-context';
import PublicHeader from '@/components/PublicHeader';
import FarmsKingQRCode from '@/components/FarmsKingQRCode';
import { getSupportContact } from '@/src/api/appSettings.api';

// ─── Public Ecosystem Nav Links ──────────────────────────────────────────────
const PUBLIC_NAV_LINKS = [
  { label: 'Home', path: '/', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { label: 'Agri Store', path: '/shop', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { label: 'Farming', path: '/topic/Farming', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { label: 'Gardening', path: '/topic/Gardening', color: '#e11d48', bg: 'rgba(225,29,72,0.1)' },
  { label: 'Crop Doctors', path: '/topic/Crop-Doctors', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
];

// ─── FarmsKing Platform Verified Latest Entries Ticker Data ───────────────────
const FARMSKING_LATEST_ENTRIES = [
  {
    crop: 'Wheat',
    variety: 'PBW-826 Premium',
    hub: 'Khanna Hub',
    price: '₹2,310/q',
    change: '+₹35 ↑',
    time: '2m ago',
  },
  {
    crop: 'Basmati Rice',
    variety: '1509 Pusa Export',
    hub: 'Amritsar Hub',
    price: '₹4,420/q',
    change: '+₹60 ↑',
    time: '5m ago',
  },
  {
    crop: 'Mustard',
    variety: 'Pusa Bold 42% Oil',
    hub: 'Bathinda Hub',
    price: '₹5,480/q',
    change: '+₹45 ↑',
    time: '8m ago',
  },
  {
    crop: 'Potato',
    variety: 'Kufri Pukhraj Fresh',
    hub: 'Jalandhar Hub',
    price: '₹1,820/q',
    change: '+₹25 ↑',
    time: '12m ago',
  },
  {
    crop: 'Cotton',
    variety: 'Narma BT-II',
    hub: 'Abohar Hub',
    price: '₹7,460/q',
    change: '+₹90 ↑',
    time: '17m ago',
  },
  {
    crop: 'Green Moong',
    variety: 'SML-668 Certified',
    hub: 'Ludhiana Hub',
    price: '₹8,180/q',
    change: '+₹115 ↑',
    time: '21m ago',
  },
  {
    crop: 'Maize',
    variety: 'Hybrid HQPM-1',
    hub: 'Hoshiarpur Hub',
    price: '₹2,240/q',
    change: '+₹30 ↑',
    time: '28m ago',
  },
  {
    crop: 'Paddy',
    variety: 'PR-126 Golden',
    hub: 'Patiala Hub',
    price: '₹2,340/q',
    change: '+₹40 ↑',
    time: '34m ago',
  },
];

// ─── Mandi Rates Dictionary for Interactive Discovery ────────────────────────
const MANDI_DATA: Record<string, Record<string, { rate: string; change: string; note: string }>> = {
  Wheat: {
    'Ludhiana APMC': { rate: '₹2,275/q', change: '+3.2%', note: 'Best Mandi to Sell' },
    'Khanna Mandi': { rate: '₹2,285/q', change: '+3.6%', note: 'Highest Asian Bid' },
    'Amritsar Mandi': { rate: '₹2,260/q', change: '+2.1%', note: 'Stable Arrival' },
    'Jalandhar APMC': { rate: '₹2,270/q', change: '+2.8%', note: 'High Demand' },
  },
  Basmati: {
    'Ludhiana APMC': { rate: '₹4,320/q', change: '+3.8%', note: 'Active Bidding' },
    'Khanna Mandi': { rate: '₹4,410/q', change: '+5.1%', note: 'Top Export Price' },
    'Amritsar Mandi': { rate: '₹4,380/q', change: '+4.5%', note: 'High Trade Volume' },
    'Jalandhar APMC': { rate: '₹4,350/q', change: '+4.0%', note: 'Steady Quality' },
  },
  Mustard: {
    'Ludhiana APMC': { rate: '₹5,380/q', change: '+1.2%', note: 'High Oil Content' },
    'Khanna Mandi': { rate: '₹5,450/q', change: '+2.0%', note: 'Peak Mill Demand' },
    'Amritsar Mandi': { rate: '₹5,350/q', change: '+0.8%', note: 'Moderate Supply' },
    'Jalandhar APMC': { rate: '₹5,420/q', change: '+1.8%', note: 'Top Grade' },
  },
  Potato: {
    'Ludhiana APMC': { rate: '₹1,780/q', change: '+1.8%', note: 'Fresh Harvest' },
    'Khanna Mandi': { rate: '₹1,750/q', change: '+1.2%', note: 'Bulk Cold Storage' },
    'Amritsar Mandi': { rate: '₹1,790/q', change: '+2.0%', note: 'High Local Retail' },
    'Jalandhar APMC': { rate: '₹1,800/q', change: '+2.1%', note: 'Top Regional Hub' },
  },
};

// ─── All-India Live APMC Mandi Feed (1-by-1 Vertical Slide-Up Telemetry) ──────
const ALL_INDIA_LIVE_MANDI_FEED = [
  {
    crop: 'Wheat',
    variety: 'Mill Grade',
    emoji: '🌾',
    mandi: 'Khanna APMC',
    state: 'Punjab',
    price: '₹2,285',
    unit: 'qtl',
    change: '+₹35 ↑',
    color: '#059669',
    tag: 'Govt APMC',
  },
  {
    crop: 'Basmati Rice',
    variety: '1121 Steam',
    emoji: '🌾',
    mandi: 'Amritsar APMC',
    state: 'Punjab',
    price: '₹4,410',
    unit: 'qtl',
    change: '+₹60 ↑',
    color: '#10b981',
    tag: 'Export Grade',
  },
  {
    crop: 'Mustard Seeds',
    variety: '42% Oil',
    emoji: '🌼',
    mandi: 'Kota APMC',
    state: 'Rajasthan',
    price: '₹5,450',
    unit: 'qtl',
    change: '+₹45 ↑',
    color: '#d97706',
    tag: 'High Oil',
  },
  {
    crop: 'Paddy Grain',
    variety: 'PR-126 Golden',
    emoji: '🌾',
    mandi: 'Karnal APMC',
    state: 'Haryana',
    price: '₹2,340',
    unit: 'qtl',
    change: '+₹40 ↑',
    color: '#0d9488',
    tag: 'Live Auction',
  },
  {
    crop: 'Cotton',
    variety: 'Narma BT-II',
    emoji: '🌿',
    mandi: 'Abohar APMC',
    state: 'Punjab',
    price: '₹7,150',
    unit: 'qtl',
    change: '+₹80 ↑',
    color: '#0284c7',
    tag: 'High Bidding',
  },
  {
    crop: 'Potato',
    variety: 'Pukhraj Fresh',
    emoji: '🥔',
    mandi: 'Jalandhar APMC',
    state: 'Punjab',
    price: '₹1,800',
    unit: 'qtl',
    change: '+₹25 ↑',
    color: '#b45309',
    tag: 'Cold Storage',
  },
  {
    crop: 'Onion',
    variety: 'Red Nashik',
    emoji: '🧅',
    mandi: 'Lasalgaon APMC',
    state: 'Maharashtra',
    price: '₹2,420',
    unit: 'qtl',
    change: '+₹70 ↑',
    color: '#be185d',
    tag: 'Asia Largest',
  },
  {
    crop: 'Tomato',
    variety: 'Hybrid Red',
    emoji: '🍅',
    mandi: 'Kolar APMC',
    state: 'Karnataka',
    price: '₹1,650',
    unit: 'qtl',
    change: '+₹50 ↑',
    color: '#dc2626',
    tag: 'Bulk Trade',
  },
  {
    crop: 'Maize',
    variety: 'Feed Grain',
    emoji: '🌽',
    mandi: 'Chhindwara APMC',
    state: 'Madhya Pradesh',
    price: '₹2,180',
    unit: 'qtl',
    change: '+₹30 ↑',
    color: '#ea580c',
    tag: 'Poultry Demand',
  },
];

// ─── 3D / 4D / 5D Spatial Tilt Component with Interactive Specular Glare ─────
function SpatialTiltCard({
  children,
  style,
  glowColor = 'rgba(167, 243, 208, 0.4)',
  tiltMax = 8,
  onPress,
  activeOpacity = 0.9,
  isInteractive = true,
}: {
  children: React.ReactNode;
  style?: any;
  glowColor?: string;
  tiltMax?: number;
  onPress?: () => void;
  activeOpacity?: number;
  isInteractive?: boolean;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, isHovered: false });

  const handleMouseMove = (e: any) => {
    if (Platform.OS !== 'web' || !isInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * (tiltMax * 2);
    const rotateY = (x - 0.5) * (tiltMax * 2);
    setTilt({
      x: rotateX,
      y: rotateY,
      glareX: x * 100,
      glareY: y * 100,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    if (Platform.OS !== 'web' || !isInteractive) return;
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, isHovered: false });
  };

  const dynamicWebStyle = Platform.OS === 'web' && isInteractive ? {
    perspective: 1200,
    transformStyle: 'preserve-3d',
    transform: tilt.isHovered
      ? `perspective(1200px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025) translateY(-7px)`
      : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0px)',
    transition: tilt.isHovered
      ? 'transform 0.12s ease-out, box-shadow 0.25s ease'
      : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease',
    boxShadow: tilt.isHovered
      ? `0 24px 48px -12px ${glowColor}, 0 0 24px ${glowColor}, inset 0 0 16px ${glowColor}`
      : '0 12px 28px -8px rgba(0, 0, 0, 0.55)',
    willChange: 'transform',
    cursor: onPress ? 'pointer' : 'default',
  } : {};

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      // @ts-ignore
      onMouseMove={handleMouseMove}
      // @ts-ignore
      onMouseLeave={handleMouseLeave}
      style={[style, dynamicWebStyle]}
    >
      {children}
      {Platform.OS === 'web' && tilt.isHovered && (
        <View
          // @ts-ignore
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 75%)`,
            zIndex: 99,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

const TRANSLATIONS = {
  EN: {
    badge: 'FarmsKing (Smart Farming Platform)',
    heroTitle: 'Revolutionizing Indian Agriculture',
    heroSub: 'Your Integrated Platform for All Crops - From Seed to Harvest.',
    getStarted: 'Get Started Free',
    exploreStore: 'Explore Agri Store',
    cultivators: 'Cultivators',
    traded: 'Traded',
    agronomists: 'Agronomists',
    liveApmc: 'LIVE',
    liveRates: 'LIVE RATES',
    instantMandi: 'All India Mandi Rates',
    cropLabel: 'Crop',
    mandiLabel: 'Mandi',
    today: 'Today',
    bestMandi: 'Best Rate',
    myRates: 'My Rates',
    officialRates: 'Official Rates',
    officialRatesBtn: 'Official Rates',
    officialAccuracyNotice: 'Sign in for official rates',
    officialRatesModalTitle: 'Official Mandi Rates',
    officialRatesModalSub: 'Sign in to access verified government APMC auction rates.',
    officialRatesPerk1: 'Real-time APMC live auction prices',
    officialRatesPerk2: 'Verified Min, Max & Modal rates',
    officialRatesPerk3: 'Direct commission agent contacts',
    officialRatesPerk4: 'Daily WhatsApp price alerts',
    signInToUnlock: 'Sign In to Unlock',
    closePreview: 'Close Preview',
    fourPillarsTitle: 'The Four Pillars of FarmsKing',
    fourPillarsSub: 'Integrated ecosystem empowering Indian agriculture from seed to harvest',
    appDownloadTitle: 'Experience FarmsKing on Mobile & Web',
    appDownloadSub: 'Scan the universal QR code with any smartphone camera to launch www.farmsking.in directly.',
    scanWithPhone: 'Scan with Smartphone',
    openFarmsKing: 'Universal Web & App QR Code',
    farmerHelpline: 'Farmer Helpline',
    helplineHours: 'Farmer Helpline • 6:00 AM – 10:00 PM IST',
    legalHeading: 'Legal & Compliance',
    mcaDisclosures: 'MCA & Statutory Disclosures',
    returnHome: 'Return to FarmsKing Homepage',
  },
  PA: {
    badge: 'ਫਾਰਮਸਕਿੰਗ (ਸਮਾਰਟ ਖੇਤੀਬਾੜੀ ਪਲੇਟਫਾਰਮ)',
    heroTitle: 'ਭਾਰਤੀ ਖੇਤੀਬਾੜੀ ਵਿੱਚ ਨਵੀਂ ਕ੍ਰਾਂਤੀ',
    heroSub: 'ਬੀਜ ਤੋਂ ਲੈ ਕੇ ਮੰਡੀ ਦੀ ਵਿਕਰੀ ਤੱਕ — ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ ਲਈ ਤੁਹਾਡਾ ਸਮਾਰਟ ਪਲੇਟਫਾਰਮ।',
    getStarted: 'ਮੁਫ਼ਤ ਸ਼ੁਰੂ ਕਰੋ',
    exploreStore: 'ਐਗਰੀ ਸਟੋਰ ਦੇਖੋ',
    cultivators: 'ਕਿਸਾਨ ਸਾਥੀ',
    traded: 'ਕੁੱਲ ਵਪਾਰ',
    agronomists: 'ਖੇਤੀ ਮਾਹਰ',
    liveApmc: 'ਲਾਈਵ',
    liveRates: 'ਲਾਈਵ ਰੇਟ',
    instantMandi: 'ਆਲ ਇੰਡੀਆ ਮੰਡੀ ਰੇਟ',
    cropLabel: 'ਫ਼ਸਲ',
    mandiLabel: 'ਮੰਡੀ',
    today: 'ਅੱਜ',
    bestMandi: 'ਵਧੀਆ ਰੇਟ',
    myRates: 'ਮੇਰੇ ਰੇਟ',
    officialRates: 'ਸਰਕਾਰੀ ਰੇਟ',
    officialRatesBtn: 'ਸਰਕਾਰੀ ਰੇਟ',
    officialAccuracyNotice: 'ਸਰਕਾਰੀ ਰੇਟਾਂ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ',
    officialRatesModalTitle: 'ਸਰਕਾਰੀ ਮੰਡੀ ਰੇਟ',
    officialRatesModalSub: 'ਪ੍ਰਮਾਣਿਤ ਸਰਕਾਰੀ APMC ਨਿਲਾਮੀ ਭਾਵ ਦੇਖਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ।',
    officialRatesPerk1: 'ਲਾਈਵ APMC ਮੰਡੀ ਬੋਲੀ ਭਾਵ',
    officialRatesPerk2: 'ਪ੍ਰਮਾਣਿਤ ਘੱਟੋ-ਘੱਟ, ਵੱਧ ਤੋਂ ਵੱਧ ਤੇ ਔਸਤ ਰੇਟ',
    officialRatesPerk3: 'ਲਾਇਸੈਂਸਸ਼ੁਦਾ ਆੜ੍ਹਤੀਆਂ ਦੇ ਸੰਪਰਕ',
    officialRatesPerk4: 'ਰੋਜ਼ਾਨਾ ਵਟਸਐਪ ਅਲਰਟ',
    signInToUnlock: 'ਸਾਈਨ ਇਨ ਕਰੋ',
    closePreview: 'ਬੰਦ ਕਰੋ',
    fourPillarsTitle: 'ਫਾਰਮਸਕਿੰਗ ਦੇ ਚਾਰ ਮੁੱਖ ਥੰਮ੍ਹ',
    fourPillarsSub: 'ਬੀਜ ਤੋਂ ਕਟਾਈ ਤੱਕ ਭਾਰਤੀ ਖੇਤੀਬਾੜੀ ਨੂੰ ਸਮਰੱਥ ਬਣਾਉਣ ਵਾਲਾ ਸੰਪੂਰਨ ਈਕੋਸਿਸਟਮ',
    appDownloadTitle: 'ਮੋਬਾਈਲ ਅਤੇ ਵੈੱਬ \'ਤੇ ਫਾਰਮਸਕਿੰਗ ਦਾ ਅਨੁਭਵ ਕਰੋ',
    appDownloadSub: 'ਆਪਣੇ ਫ਼ੋਨ ਵਿੱਚ www.farmsking.in ਤੁਰੰਤ ਖੋਲ੍ਹਣ ਲਈ ਕੈਮਰੇ ਨਾਲ ਸਕੈਨ ਕਰੋ।',
    scanWithPhone: 'ਕੈਮਰੇ ਨਾਲ ਸਕੈਨ ਕਰੋ',
    openFarmsKing: 'ਯੂਨੀਵਰਸਲ ਵੈੱਬ ਅਤੇ ਐਪ QR ਕੋਡ',
    farmerHelpline: 'ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ',
    helplineHours: 'ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ • ਸਵੇਰੇ 6:00 ਤੋਂ ਰਾਤ 10:00 ਵਜੇ ਤੱਕ',
    legalHeading: 'ਕਾਨੂੰਨੀ ਅਤੇ ਪਾਲਣਾ',
    mcaDisclosures: 'MCA ਅਤੇ ਵਿਧਾਨਕ ਖੁਲਾਸੇ',
    returnHome: 'ਫਾਰਮਸਕਿੰਗ ਹੋਮਪੇਜ \'ਤੇ ਵਾਪਸ ਜਾਓ',
  },
  HI: {
    badge: 'फार्म्सकिंग (स्मार्ट कृषि प्लेटफॉर्म)',
    heroTitle: 'भारतीय कृषि में नई क्रांति',
    heroSub: 'बीज से लेकर मंडी बिक्री तक — सभी फसलों के लिए आपका संपूर्ण स्मार्ट प्लेटफॉर्म।',
    getStarted: 'मुफ्त शुरू करें',
    exploreStore: 'एग्री स्टोर देखें',
    cultivators: 'किसान साथी',
    traded: 'कुल व्यापार',
    agronomists: 'कृषि विशेषज्ञ',
    liveApmc: 'लाइव',
    liveRates: 'लाइव भाव',
    instantMandi: 'ऑल इंडिया मंडी भाव',
    cropLabel: 'फसल',
    mandiLabel: 'मंडी',
    today: 'आज',
    bestMandi: 'सर्वश्रेष्ठ भाव',
    myRates: 'मेरे भाव',
    officialRates: 'सरकारी भाव',
    officialRatesBtn: 'सरकारी भाव',
    officialAccuracyNotice: 'सरकारी भाव के लिए साइन इन करें',
    officialRatesModalTitle: 'सरकारी मंडी भाव',
    officialRatesModalSub: 'प्रमाणित सरकारी APMC नीलामी भाव देखने के लिए साइन इन करें।',
    officialRatesPerk1: 'लाइव APMC मंडी बोली भाव',
    officialRatesPerk2: 'प्रमाणित न्यूनतम, अधिकतम व मॉडल भाव',
    officialRatesPerk3: 'लाइसेंसधारी व्यापारियों के संपर्क',
    officialRatesPerk4: 'दैनिक व्हाट्सऐप अलर्ट',
    signInToUnlock: 'साइन इन करें',
    closePreview: 'बंद करें',
    fourPillarsTitle: 'फार्म्सकिंग के चार मुख्य स्तंभ',
    fourPillarsSub: 'बीज से कटाई तक भारतीय कृषि को सशक्त बनाने वाला संपूर्ण इकोसिस्टम',
    appDownloadTitle: 'मोबाइल और वेब पर फार्म्सकिंग का अनुभव करें',
    appDownloadSub: 'अपने फोन में www.farmsking.in तुरंत खोलने के लिए कैमरे से स्कैन करें।',
    scanWithPhone: 'कैमरे से स्कैन करें',
    openFarmsKing: 'यूनिवर्सल वेब और ऐप QR कोड',
    farmerHelpline: 'किसान हेल्पलाइन',
    helplineHours: 'किसान हेल्पलाइन • सुबह 6:00 से रात 10:00 बजे तक',
    legalHeading: 'कानूनी और अनुपालन',
    mcaDisclosures: 'MCA और वैधानिक खुलासे',
    returnHome: 'फार्म्सकिंग होमपेज पर लौटें',
  },
};

// ── Real-Time Dynamic Social Proof Farmer Activity Feed ──
const LIVE_FARMER_ACTIVITIES = [
  {
    id: 1,
    emoji: '🌾',
    name: 'Sardar Gurmukh Singh',
    location: 'Sangrur',
    action: 'Checked Basmati 1121 live APMC rate',
    detail: '₹3,420/q • Best Local Mandi',
    timeAgo: '1 min ago',
    tagColor: '#10b981',
  },
  {
    id: 2,
    emoji: '🧪',
    name: 'Harpreet Singh',
    location: 'Moga',
    action: 'Scanned wheat leaf with AI Crop Doctor',
    detail: 'Yellow Rust detected & dose prescribed',
    timeAgo: 'Just now',
    tagColor: '#06b6d4',
  },
  {
    id: 3,
    emoji: '📦',
    name: 'Kuldeep Singh',
    location: 'Bathinda',
    action: 'Ordered Certified Organic Seeds & Bio-Inputs',
    detail: 'Fast Doorstep Delivery dispatched',
    timeAgo: '3 mins ago',
    tagColor: '#f97316',
  },
  {
    id: 4,
    emoji: '🛸',
    name: 'Balwinder Singh',
    location: 'Ludhiana',
    action: 'Booked Precision Drone Spraying for 12 Acres',
    detail: 'Verified GPS Fleet Assigned',
    timeAgo: '4 mins ago',
    tagColor: '#8b5cf6',
  },
  {
    id: 5,
    emoji: '🩺',
    name: 'Dr. Jasvir Singh (Agronomist)',
    location: 'PAU Specialist Desk',
    action: 'Answered live farmer audio call on Helpline',
    detail: 'Immediate crop nutrition prescribed',
    timeAgo: '2 mins ago',
    tagColor: '#10b981',
  },
  {
    id: 6,
    emoji: '🌾',
    name: 'Jagtar Singh',
    location: 'Amritsar',
    action: 'Tracked Mandi APMC rates for Mustard & Wheat',
    detail: 'eNAM Synchronized Auction',
    timeAgo: 'Just now',
    tagColor: '#10b981',
  },
  {
    id: 7,
    emoji: '🌿',
    name: 'Manpreet Kaur',
    location: 'Patiala',
    action: 'Ordered Terrace Gardening & Nursery Kit',
    detail: 'Organic Soil & Pots Pack',
    timeAgo: '6 mins ago',
    tagColor: '#e11d48',
  },
];

// ── 5-Second AI Doctor Interactive Crop Diagnosis Samples ──
const AI_DOCTOR_SAMPLES = [
  {
    id: 'wheat',
    crop: 'Wheat',
    disease: 'Yellow Rust / Stripe Rust',
    pathogen: 'Puccinia striiformis',
    leafEmoji: '🌾',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    accuracy: '98.8%',
    severity: 'High Severity • Spores Active',
    symptoms: 'Yellow-orange pustules in continuous linear stripes on wheat leaves',
    medicine: 'Propiconazole 25% EC (Tilt / Bumper)',
    dosage: '200 ml in 200 Litres water per acre',
    prevention: 'Spray on morning calm before rust spreads to upper flag leaf',
    shopQuery: 'Propiconazole',
    audioNarrationEnglish: 'Diagnosis confirmed: Wheat Yellow Rust. Recommended treatment: Propiconazole 25 EC at 200 ml in 200 liters of water per acre.',
  },
  {
    id: 'cotton',
    crop: 'Cotton',
    disease: 'Whitefly Infestation',
    pathogen: 'Bemisia tabaci',
    leafEmoji: '🌱',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    accuracy: '99.2%',
    severity: 'Critical • Leaf Curl Risk',
    symptoms: 'White sap-sucking insects under foliage, black sooty mold on leaf top',
    medicine: 'Diafenthiuron 50% WP (Pegasus) / Pyriproxyfen 10% EC',
    dosage: '250 g in 150 Litres water per acre',
    prevention: 'Spray targeting undersides of foliage using hollow cone nozzle',
    shopQuery: 'Diafenthiuron',
    audioNarrationEnglish: 'Diagnosis confirmed: Cotton Whitefly Infestation. Recommended treatment: Diafenthiuron 50 WP at 250 grams per acre.',
  },
  {
    id: 'potato',
    crop: 'Potato',
    disease: 'Late Blight Disease',
    pathogen: 'Phytophthora infestans',
    leafEmoji: '🥔',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    accuracy: '97.9%',
    severity: 'Severe • High Humidity Threat',
    symptoms: 'Water-soaked purplish-brown lesions with white mildew on lower leaf surface',
    medicine: 'Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold)',
    dosage: '600 g in 200 Litres water per acre',
    prevention: 'Preventive spray before dense fog and cold damp nights',
    shopQuery: 'Ridomil',
    audioNarrationEnglish: 'Diagnosis confirmed: Potato Late Blight. Recommended treatment: Ridomil Gold at 600 grams in 200 liters of water per acre.',
  },
];

export default function PublicLandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  // ── Farmers Audio Advisory Voice Assistant State ──
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);

  const speakText = (text: string, id: string = 'main') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    if (isSpeaking && currentSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const punjabiVoice = voices.find((v) => v.lang === 'pa-IN' || v.lang.startsWith('pa'));
    const hindiVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
    const indianVoice = voices.find((v) => v.lang.includes('IN') || v.lang.includes('India'));

    if (punjabiVoice) {
      utterance.voice = punjabiVoice;
      utterance.lang = 'pa-IN';
    } else if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
    } else if (indianVoice) {
      utterance.voice = indianVoice;
      utterance.lang = 'en-IN';
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentSpeakingId(id);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── 5-Second AI Doctor Interactive Demo State ──
  const [selectedAiSampleId, setSelectedAiSampleId] = useState<string>('wheat');
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanProgress, setAiScanProgress] = useState<number>(100);
  const [aiDiagnosticReady, setAiDiagnosticReady] = useState<boolean>(true);

  const handleSelectAiSample = (sampleId: string) => {
    if (isAiScanning && selectedAiSampleId === sampleId) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentSpeakingId(null);

    setSelectedAiSampleId(sampleId);
    setIsAiScanning(true);
    setAiDiagnosticReady(false);
    setAiScanProgress(15);

    let progress = 15;
    const interval = setInterval(() => {
      progress += 25;
      setAiScanProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        setIsAiScanning(false);
        setAiDiagnosticReady(true);
      }
    }, 450);
  };

  const activeAiSample =
    AI_DOCTOR_SAMPLES.find((s) => s.id === selectedAiSampleId) || AI_DOCTOR_SAMPLES[0];

  // Dynamic Localized Social Proof State Detection (IP / Geo / Timezone)
  const [userRegion, setUserRegion] = useState({
    stateName: 'Punjab',
    regionText: 'Punjab & North India',
    farmerCount: '48,000+',
    rating: '4.95/5',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('farmsking_user_state');
        if (cached) {
          setUserRegion({
            stateName: cached,
            regionText: `${cached} & Across India`,
            farmerCount: '48,000+',
            rating: '4.95/5',
          });
        }

        // Fast IP Location check with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        fetch('https://ipapi.co/json/', { signal: controller.signal })
          .then((r) => r.json())
          .then((data) => {
            clearTimeout(timeoutId);
            if (data && data.region) {
              const state = data.region;
              localStorage.setItem('farmsking_user_state', state);
              setUserRegion({
                stateName: state,
                regionText: `${state} & Across India`,
                farmerCount: '48,000+',
                rating: '4.95/5',
              });
            }
          })
          .catch(() => {});
      } catch (e) {}
    }
  }, []);

  // ── Live Social Proof Activity Ticker (Smooth slide every 6 seconds) ──
  const [activeActivityIdx, setActiveActivityIdx] = useState(0);
  const [tickerDismissed, setTickerDismissed] = useState(false);
  const tickerFadeAnim = useSharedValue(1);
  const tickerSlideAnim = useSharedValue(0);

  useEffect(() => {
    if (tickerDismissed) return;

    const interval = setInterval(() => {
      tickerFadeAnim.value = withTiming(0, { duration: 320 });
      tickerSlideAnim.value = withTiming(14, { duration: 320 });

      setTimeout(() => {
        setActiveActivityIdx((prev) => (prev + 1) % LIVE_FARMER_ACTIVITIES.length);
        tickerSlideAnim.value = -14;
        tickerFadeAnim.value = withTiming(1, { duration: 380 });
        tickerSlideAnim.value = withTiming(0, { duration: 380 });
      }, 340);
    }, 6000);

    return () => clearInterval(interval);
  }, [tickerDismissed]);

  const tickerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tickerFadeAnim.value,
    transform: [{ translateY: tickerSlideAnim.value }],
  }));

  const currentActivity = LIVE_FARMER_ACTIVITIES[activeActivityIdx] || LIVE_FARMER_ACTIVITIES[0];

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected language state
  const [lang, setLang] = useState<'EN' | 'PA' | 'HI'>('EN');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  // Dynamic support contact fetched from Admin Settings backend
  const [supportContact, setSupportContact] = useState<{ helplinePhone: string; supportEmail: string }>({
    helplinePhone: '95776-220000',
    supportEmail: 'farmskingindia@gmail.com',
  });

  useEffect(() => {
    getSupportContact()
      .then((contact) => {
        if (contact?.helplinePhone || contact?.supportEmail) {
          setSupportContact({
            helplinePhone: contact.helplinePhone || '95776-220000',
            supportEmail: contact.supportEmail || 'farmskingindia@gmail.com',
          });
        }
      })
      .catch(() => {});
  }, []);

  // Interactive Mandi Discovery state
  const [selectedCrop, setSelectedCrop] = useState<string>('Wheat');
  const [selectedMandi, setSelectedMandi] = useState<string>('Ludhiana APMC');
  const [officialRatesModalVisible, setOfficialRatesModalVisible] = useState(false);
  const [activeMandiRollIdx, setActiveMandiRollIdx] = useState(0);
  const [isRollPaused, setIsRollPaused] = useState(false);

  useEffect(() => {
    if (isRollPaused) return;
    const interval = setInterval(() => {
      setActiveMandiRollIdx((prev) => (prev + 1) % ALL_INDIA_LIVE_MANDI_FEED.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isRollPaused]);

  // Theme state: 'day' (default) vs 'night'
  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');

  // Pulse animation on Login CTA when no user
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (!user) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 1400 }), withTiming(1, { duration: 1400 })),
        -1,
        true
      );
    }
  }, [user]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('farmsking_theme_mode');
      if (savedTheme === 'night' || savedTheme === 'day') {
        setThemeMode(savedTheme);
      }
      const savedLang = localStorage.getItem('farmsking_user_language');
      if (savedLang) {
        const u = savedLang.toUpperCase();
        if (u === 'EN' || u === 'PA' || u === 'HI') setLang(u as any);
      }
      const handleStorage = () => {
        const theme = localStorage.getItem('farmsking_theme_mode');
        if (theme === 'night' || theme === 'day') setThemeMode(theme);
        const l = localStorage.getItem('farmsking_user_language');
        if (l) {
          const u = l.toUpperCase();
          if (u === 'EN' || u === 'PA' || u === 'HI') setLang(u as any);
        }
      };
      const handleCustomLang = (e: any) => {
        const l = e?.detail || localStorage.getItem('farmsking_user_language');
        if (l) {
          const u = String(l).toUpperCase();
          if (u === 'EN' || u === 'PA' || u === 'HI') setLang(u as any);
        }
      };
      window.addEventListener('storage', handleStorage);
      window.addEventListener('farmsking_language_change', handleCustomLang);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('farmsking_language_change', handleCustomLang);
      };
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

  // ─── 4D / 5D CSS Injection for Browser Web ────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'farmsking-executive-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          /* ── Suppress reCAPTCHA v3 badge ── */
          .grecaptcha-badge {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          /* ── Premium Continuous FarmsKing Ticker Flow ── */
          @keyframes farmskingTickerFlow {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }
          .ticker-viewport-flow {
            position: relative !important;
            overflow: hidden !important;
            flex: 1 !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%) !important;
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%) !important;
          }
          .ticker-track-flow {
            display: inline-flex !important;
            flex-direction: row !important;
            align-items: center !important;
            width: max-content !important;
            white-space: nowrap !important;
            animation: farmskingTickerFlow 45s linear infinite !important;
            will-change: transform !important;
          }
          .ticker-track-flow:hover {
            animation-play-state: paused !important;
          }
          .ticker-cta-chip {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .ticker-cta-chip:hover {
            transform: scale(1.025);
          }
          /* ── Mobile Docked Bottom App Bar & App Sheet ── */
          .mobile-docked-bottom-bar {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
          }
          .app-sheet-backdrop {
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
          }
          .app-module-tile {
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          }
          .app-module-tile:hover {
            transform: translateY(-2px) scale(1.02) !important;
          }
          @keyframes laserSweep4D {
            0% { top: 0%; opacity: 0; }
            8% { opacity: 0.95; }
            92% { opacity: 0.95; }
            100% { top: 96%; opacity: 0; }
          }
          @keyframes radarSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes radarWavePing {
            0% { transform: scale(0.7); opacity: 0.9; }
            100% { transform: scale(2.4); opacity: 0; }
          }
          @keyframes holoNightTextFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatAmbientOrb {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-16px) scale(1.05); }
          }
          @keyframes floatTelemetry {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes beaconPulseUniversal {
            0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(167, 243, 208, 0); }
            100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(167, 243, 208, 0); }
          }
          .holo-night-title {
            background: linear-gradient(135deg, #ffffff 0%, #a7f3d0 25%, #bae6fd 50%, #fbcfe8 75%, #fde68a 100%);
            background-size: 250% 250%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: holoNightTextFlow 7s ease infinite;
          }
          .cyber-laser-beam {
            position: absolute;
            left: 0;
            right: 0;
            height: 2.5px;
            background: linear-gradient(90deg, transparent 5%, #a7f3d0 30%, #bae6fd 50%, #fbcfe8 70%, transparent 95%);
            box-shadow: 0 0 16px #a7f3d0, 0 0 32px #bae6fd;
            animation: laserSweep4D 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            pointer-events: none;
            z-index: 25;
          }
          .radar-target-circle {
            position: absolute;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 1.5px dashed rgba(186, 230, 253, 0.7);
            top: 20%;
            right: 26%;
            pointer-events: none;
            animation: radarSpin 9s linear infinite;
            z-index: 22;
          }
          .radar-pulse-ring {
            position: absolute;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 1.5px solid rgba(167, 243, 208, 0.85);
            top: 20%;
            right: 26%;
            pointer-events: none;
            animation: radarWavePing 2.4s ease-out infinite;
            z-index: 21;
          }
          .radar-center-dot {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background: #bae6fd;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 8px #bae6fd;
          }
          .float-telemetry-anim {
            animation: floatTelemetry 4s ease-in-out infinite;
          }
          .orb-breathe-anim {
            animation: floatAmbientOrb 8s ease-in-out infinite;
          }
          .orig-pill-btn {
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            cursor: pointer !important;
          }
          .orig-pill-btn:hover {
            transform: translateY(-2px) scale(1.025) !important;
            filter: brightness(1.2) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;
          }
          .orig-chevron-btn {
            transition: all 0.2s ease !important;
            cursor: pointer !important;
          }
          .orig-chevron-btn:hover {
            transform: scale(1.12) !important;
            background-color: rgba(255, 255, 255, 0.22) !important;
          }
          .orig-glass-card {
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            background: linear-gradient(180deg, rgba(28, 38, 54, 0.8) 0%, rgba(18, 26, 40, 0.86) 100%) !important;
            box-shadow: 0 20px 45px -12px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.22) !important;
          }
          .orig-glass-card:hover {
            border-color: rgba(255, 255, 255, 0.35) !important;
            box-shadow: 0 28px 56px -12px rgba(0, 0, 0, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.35) !important;
          }
          .holo-day-title {
            background: linear-gradient(135deg, #0f172a 0%, #15803d 35%, #0369a1 70%, #0f172a 100%);
            background-size: 250% 250%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: holoNightTextFlow 7s ease infinite;
          }
          .orig-glass-card-day {
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(246, 250, 248, 0.9) 100%) !important;
            box-shadow: 0 16px 36px -10px rgba(15, 23, 42, 0.08), inset 0 1px 2px rgba(255, 255, 255, 1) !important;
            border-color: rgba(226, 232, 240, 0.95) !important;
          }
          .orig-glass-card-day:hover {
            border-color: rgba(16, 185, 129, 0.4) !important;
            box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.14), inset 0 1px 3px rgba(255, 255, 255, 1) !important;
          }
          .orig-pill-btn-day {
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            cursor: pointer !important;
          }
          .orig-pill-btn-day:hover {
            transform: translateY(-2px) scale(1.03) !important;
            filter: brightness(0.96) !important;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08) !important;
          }
          .pillar-thumb-box {
            position: relative !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 184px !important;
            border-radius: 20px !important;
            overflow: visible !important;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .pillar-thumb-img {
            width: 100% !important;
            max-width: 220px !important;
            height: 172px !important;
            object-fit: contain !important;
            background-color: transparent !important;
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s ease !important;
          }
          .orig-glass-card:hover .pillar-thumb-img,
          .orig-glass-card-day:hover .pillar-thumb-img {
            transform: scale(1.08) translateY(-6px) !important;
          }
          /* Day Mode Seamless Radial Spotlight & Theme Drop Shadows */
          .thumb-box-farming-day {
            background: radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.9) 0%, rgba(251, 191, 36, 0.28) 45%, rgba(251, 191, 36, 0) 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-gardening-day {
            background: radial-gradient(circle at 50% 50%, rgba(253, 232, 243, 0.9) 0%, rgba(244, 114, 182, 0.28) 45%, rgba(244, 114, 182, 0) 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-cropdoctors-day {
            background: radial-gradient(circle at 50% 50%, rgba(209, 250, 229, 0.9) 0%, rgba(52, 211, 153, 0.28) 45%, rgba(52, 211, 153, 0) 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-agristore-day {
            background: radial-gradient(circle at 50% 50%, rgba(224, 242, 254, 0.9) 0%, rgba(56, 189, 248, 0.28) 45%, rgba(56, 189, 248, 0) 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-farming-day .pillar-thumb-img {
            filter: drop-shadow(0 14px 22px rgba(217, 119, 6, 0.35)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)) !important;
          }
          .thumb-box-gardening-day .pillar-thumb-img {
            filter: drop-shadow(0 14px 22px rgba(219, 39, 119, 0.35)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)) !important;
          }
          .thumb-box-cropdoctors-day .pillar-thumb-img {
            filter: drop-shadow(0 14px 22px rgba(5, 150, 105, 0.35)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)) !important;
          }
          .thumb-box-agristore-day .pillar-thumb-img {
            filter: drop-shadow(0 14px 22px rgba(2, 132, 199, 0.35)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)) !important;
          }
          /* Night Mode Mix Color Luminous Stages */
          .thumb-box-farming {
            background: radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.32) 0%, rgba(245, 158, 11, 0.1) 50%, transparent 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-gardening {
            background: radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.32) 0%, rgba(244, 114, 182, 0.1) 50%, transparent 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-cropdoctors {
            background: radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.32) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-agristore {
            background: radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.32) 0%, rgba(14, 165, 233, 0.1) 50%, transparent 72%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          .thumb-box-farming .pillar-thumb-img {
            filter: drop-shadow(0 16px 26px rgba(245, 158, 11, 0.50)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) !important;
          }
          .thumb-box-gardening .pillar-thumb-img {
            filter: drop-shadow(0 16px 26px rgba(244, 114, 182, 0.50)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) !important;
          }
          .thumb-box-cropdoctors .pillar-thumb-img {
            filter: drop-shadow(0 16px 26px rgba(52, 211, 153, 0.50)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) !important;
          }
          .thumb-box-agristore .pillar-thumb-img {
            filter: drop-shadow(0 16px 26px rgba(56, 189, 248, 0.50)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) !important;
          }
          /* 4D Official Rates Button Specular Sheen & Depth */
          .four-d-official-btn {
            position: relative !important;
            overflow: hidden !important;
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
            cursor: pointer !important;
          }
          .four-d-official-btn:hover {
            transform: translateY(-2px) scale(1.03) !important;
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.6) !important;
          }
          .four-d-official-btn:active {
            transform: translateY(1px) scale(0.97) !important;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3) !important;
          }
          .four-d-official-btn::after {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: -120% !important;
            width: 60% !important;
            height: 100% !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent) !important;
            transform: skewX(-20deg) !important;
            animation: fourDShine 4s infinite !important;
          }
          @keyframes fourDShine {
            0%, 70% { left: -120%; }
            100% { left: 160%; }
          }
          /* 1-by-1 Vertical Slide-Up Ticker Animation */
          @keyframes mandiItemSlideUp {
            0% {
              opacity: 0;
              transform: translateY(18px) scale(0.97);
            }
            15% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            88% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateY(-16px) scale(0.97);
            }
          }
          .mandi-item-slide-anim {
            animation: mandiItemSlideUp 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite !important;
          }
          /* Kinetic Login For Your Own Crop Rates Button */
          .kinetic-login-rates-btn {
            position: relative !important;
            overflow: hidden !important;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            cursor: pointer !important;
          }
          .kinetic-login-rates-btn:hover {
            transform: translateY(-2px) scale(1.015) !important;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.6) !important;
          }
          .kinetic-login-rates-btn:active {
            transform: translateY(1px) scale(0.99) !important;
          }
          .kinetic-login-rates-btn::after {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: -120% !important;
            width: 50% !important;
            height: 100% !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent) !important;
            transform: skewX(-20deg) !important;
            animation: kineticSweep 3.5s infinite !important;
          }
          @keyframes kineticSweep {
            0%, 65% { left: -120%; }
            100% { left: 160%; }
          }
          /* ── Superior Living Smart Farm Cinemagraph Animations ── */
          @keyframes livingFarmBreeze {
            0% {
              transform: scale(1.02) translateY(0px) rotate(0deg);
            }
            25% {
              transform: scale(1.036) translateY(-4px) rotate(0.45deg);
            }
            50% {
              transform: scale(1.024) translateY(-1.5px) rotate(-0.35deg);
            }
            75% {
              transform: scale(1.042) translateY(-4.5px) rotate(0.4deg);
            }
            100% {
              transform: scale(1.02) translateY(0px) rotate(0deg);
            }
          }
          /* Drone Spray Mist Cascade */
          @keyframes droneSprayCascade {
            0% {
              opacity: 0.25;
              transform: scaleX(0.75) scaleY(0.85);
            }
            50% {
              opacity: 0.95;
              transform: scaleX(1.3) scaleY(1.1);
            }
            100% {
              opacity: 0.25;
              transform: scaleX(0.75) scaleY(0.85);
            }
          }
          /* Drone Spray Droplet Stream Drift */
          @keyframes droneSprayDrift {
            0% {
              transform: translateY(0) scaleY(0.6);
              opacity: 0.2;
            }
            50% {
              opacity: 0.9;
            }
            100% {
              transform: translateY(35px) scaleY(1.2);
              opacity: 0;
            }
          }
          /* Drone Aviation Nav Strobes */
          @keyframes droneStrobePulse {
            0%, 70%, 100% { opacity: 0.15; transform: scale(0.7); }
            75%, 90% { opacity: 1; transform: scale(1.6); }
          }
          /* Farmer Tablet Screen Glow */
          @keyframes tabletScreenPulse {
            0%, 100% {
              box-shadow: 0 0 8px #38bdf8, 0 0 16px rgba(56, 189, 248, 0.6);
              opacity: 0.8;
            }
            50% {
              box-shadow: 0 0 20px #38bdf8, 0 0 35px rgba(56, 189, 248, 1);
              opacity: 1;
            }
          }
          /* Farmer Scanning Laser Fan */
          @keyframes tabletScanFanSweep {
            0% {
              transform: rotate(-18deg) scale(0.88);
              opacity: 0.35;
            }
            50% {
              transform: rotate(20deg) scale(1.18);
              opacity: 0.95;
            }
            100% {
              transform: rotate(-18deg) scale(0.88);
              opacity: 0.35;
            }
          }
          /* Crop Health Telemetry Target Rings */
          @keyframes cropTargetPing {
            0% {
              transform: scale(0.4);
              opacity: 0.95;
            }
            100% {
              transform: scale(1.9);
              opacity: 0;
            }
          }
          /* Sunbeam Pollen / Flower Drift Particles */
          @keyframes pollenSunDrift1 {
            0% { transform: translate3d(0, 0, 0); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translate3d(160px, -50px, 0); opacity: 0; }
          }
          @keyframes pollenSunDrift2 {
            0% { transform: translate3d(0, 0, 0); opacity: 0; }
            20% { opacity: 0.95; }
            80% { opacity: 0.95; }
            100% { transform: translate3d(130px, -35px, 0); opacity: 0; }
          }
          /* ── Wide Glowing "Get Started Free" Button & Halo Pulse ── */
          @keyframes glowingGetStartedBreath {
            0%, 100% {
              box-shadow: 0 4px 22px rgba(16, 185, 129, 0.45), 0 0 35px rgba(52, 211, 153, 0.35);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 6px 32px rgba(16, 185, 129, 0.8), 0 0 55px rgba(52, 211, 153, 0.6);
              transform: scale(1.02);
            }
          }
          .wide-glowing-get-started-btn {
            animation: glowingGetStartedBreath 2.8s ease-in-out infinite !important;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            cursor: pointer !important;
          }
          .wide-glowing-get-started-btn:hover {
            transform: translateY(-2px) scale(1.04) !important;
            box-shadow: 0 8px 38px rgba(16, 185, 129, 0.9), 0 0 60px rgba(52, 211, 153, 0.75) !important;
          }
          .wide-glowing-get-started-btn:active {
            transform: translateY(1px) scale(0.99) !important;
          }

          /* ── Live Activity Ticker Glow ── */
          .live-ticker-shadow-day {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.15) !important;
          }
          .live-ticker-shadow-night {
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.65), 0 0 25px rgba(52, 211, 153, 0.25) !important;
          }

          /* ── Floating Quick WhatsApp Support Pulse ── */
          @keyframes floatingWhatsAppBreath {
            0%, 100% {
              box-shadow: 0 4px 18px rgba(37, 211, 102, 0.5), 0 0 24px rgba(37, 211, 102, 0.3);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 6px 28px rgba(37, 211, 102, 0.85), 0 0 42px rgba(37, 211, 102, 0.6);
              transform: scale(1.035);
            }
          }
          .floating-whatsapp-pulse {
            animation: floatingWhatsAppBreath 2.6s ease-in-out infinite !important;
            transition: all 0.22s ease !important;
            cursor: pointer !important;
          }
          .floating-whatsapp-pulse:hover {
            transform: translateY(-2px) scale(1.06) !important;
            box-shadow: 0 8px 34px rgba(37, 211, 102, 0.95), 0 0 48px rgba(37, 211, 102, 0.7) !important;
          }

          /* ── 5-Second AI Doctor Cyber Laser Beam Animation ── */
          @keyframes laserScanSweepVertical {
            0% { top: 4%; opacity: 0.9; }
            50% { top: 92%; opacity: 1; }
            100% { top: 4%; opacity: 0.9; }
          }
          .ai-doctor-laser-beam {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            height: 3.5px !important;
            background: linear-gradient(90deg, transparent, #38bdf8, #34d399, #38bdf8, transparent) !important;
            box-shadow: 0 0 14px #38bdf8, 0 0 26px #34d399 !important;
            animation: laserScanSweepVertical 1.6s ease-in-out infinite !important;
            pointer-events: none !important;
            z-index: 12 !important;
          }

          /* ── Continuous Live Mandi Upward Scroll Animation (Prices Gliding Upwards) ── */
          @keyframes mandiContinuousUpwardScroll {
            0% {
              transform: translateY(0px);
            }
            100% {
              transform: translateY(-522px);
            }
          }
          .mandi-vertical-ticker-window {
            height: 114px !important;
            overflow: hidden !important;
            position: relative !important;
            border-radius: 14px !important;
          }
          .mandi-vertical-ticker-track {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            animation: mandiContinuousUpwardScroll 22s linear infinite !important;
            will-change: transform !important;
          }
          .mandi-vertical-ticker-window:hover .mandi-vertical-ticker-track {
            animation-play-state: paused !important;
          }
          .mandi-roller-row-item {
            height: 52px !important;
            box-sizing: border-box !important;
            transition: transform 0.15s ease, background-color 0.15s ease !important;
          }
          .mandi-roller-row-item:hover {
            transform: scale(1.008) !important;
          }

          /* ── Voice Audio Readout Equalizer ── */
          @keyframes audioEqualizerWave {
            0%, 100% { height: 4px; }
            50% { height: 14px; }
          }
          .audio-wave-anim-1 {
            animation: audioEqualizerWave 0.7s ease-in-out infinite !important;
          }
          .audio-wave-anim-2 {
            animation: audioEqualizerWave 0.5s ease-in-out infinite 0.15s !important;
          }
          .audio-wave-anim-3 {
            animation: audioEqualizerWave 0.85s ease-in-out infinite 0.3s !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const activeMandiInfo = useMemo(() => {
    return (
      MANDI_DATA[selectedCrop]?.[selectedMandi] || {
        rate: '₹2,275/q',
        change: '+3.2%',
        note: 'Best Mandi to Sell',
      }
    );
  }, [selectedCrop, selectedMandi]);

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'admin.farmsking.in' || window.location.hostname.startsWith('admin.'))
  ) {
    return <AdminWebPortalScreen />;
  }

  return (
    <View style={[S.root, isDay && S.rootDay]}>
      {/* ══ UNIFIED PUBLIC FLOATING HEADER (IDENTICAL ACROSS ALL TABS) ══ */}
      <PublicHeader themeMode={themeMode} onThemeToggle={toggleTheme} />

      <ScrollView
        contentContainerStyle={[
          S.scrollContainer,
          isMobile ? S.scrollContainerMobile : S.scrollContainerDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ HERO SECTION (SPLIT 2-COLUMN) ══ */}
        <View style={[S.heroSection, isDesktop ? S.heroDesktop : S.heroMobile]}>
          {/* Subtle Ambient Glowing Baby Light Orbs */}
          <View style={[isDay ? S.glowOrbSunDay : S.glowOrbBabyMint, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim' } as any) : {}]} />
          <View style={[isDay ? S.glowOrbSkyDay : S.glowOrbBabyBlue, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim' } as any) : {}]} />
          <View style={[isDay ? S.glowOrbPastureDay : S.glowOrbBabyPink, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim' } as any) : {}]} />
          <View style={[isDay ? S.glowOrbDawnDay : S.glowOrbBabyPeach, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim' } as any) : {}]} />

          {/* Left Column: Clean Headlines & Interactive Mandi Directory */}
          <View style={[S.heroLeft, isDesktop ? { flex: 6 } : { width: '100%' }]}>

            {/* ══ SOCIAL PROOF STARS BADGE (4.9/5 RATING) & AUDIO ADVISORY CHIP ══ */}
            <View style={S.heroBadgesRow}>
              <View style={[S.socialProofBadge, isDay ? S.socialProofBadgeDay : S.socialProofBadgeNight]}>
                <View style={S.starsGroup}>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Ionicons key={i} name="star" size={13} color="#f59e0b" style={{ marginRight: 1 }} />
                  ))}
                </View>
                <Text style={[S.ratingScoreText, isDay ? S.ratingScoreTextDay : S.ratingScoreTextNight]}>
                  4.9/5
                </Text>
                <Text style={[S.ratingReviewsCount, isDay ? S.ratingReviewsCountDay : S.ratingReviewsCountNight]}>
                  (14,200+ Reviews)
                </Text>
                <View style={[S.socialProofDivider, isDay ? S.socialProofDividerDay : S.socialProofDividerNight]} />
                <Ionicons name="shield-checkmark" size={12} color={isDay ? '#059669' : '#34d399'} />
                <Text style={[S.socialProofText, isDay ? S.socialProofTextDay : S.socialProofTextNight]}>
                  Trusted by {userRegion.farmerCount} Cultivators in {userRegion.regionText}
                </Text>
              </View>

              {/* 🔊 Audio Readout Quick Chip */}
              <TouchableOpacity
                style={[
                  S.heroAudioReadoutBtn,
                  isSpeaking && currentSpeakingId === 'hero-advisory'
                    ? S.heroAudioReadoutBtnActive
                    : (isDay ? S.heroAudioReadoutBtnDay : S.heroAudioReadoutBtnNight),
                ]}
                onPress={() => {
                  const speech =
                    lang === 'PA'
                      ? 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ। ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਇੱਥੇ ਤੁਸੀਂ ਪੰਜ ਸਕਿੰਟਾਂ ਵਿੱਚ ਫਸਲ ਦੀ ਬਿਮਾਰੀ ਸਕੈਨ ਕਰ ਸਕਦੇ ਹੋ, ਲਾਈਵ ਮੰਡੀ ਭਾਅ ਦੇਖ ਸਕਦੇ ਹੋ ਅਤੇ ਅਸਲੀ ਦਵਾਈਆਂ ਤੇ ਬੀਜ ਮੰਗਵਾ ਸਕਦੇ ਹੋ।'
                      : 'Welcome to FarmsKing Agri Intelligence. Instant 5-second plant doctor diagnosis, live APMC mandi prices across India, and certified farm inputs delivered directly to your farm.';
                  speakText(speech, 'hero-advisory');
                }}
                activeOpacity={0.85}
                accessibilityLabel="Listen to Daily Agri Audio Advisory"
              >
                <Ionicons
                  name={isSpeaking && currentSpeakingId === 'hero-advisory' ? 'volume-high' : 'volume-medium-outline'}
                  size={14}
                  color={isSpeaking && currentSpeakingId === 'hero-advisory' ? '#ffffff' : (isDay ? '#059669' : '#34d399')}
                />
                <Text
                  style={[
                    S.heroAudioReadoutText,
                    isSpeaking && currentSpeakingId === 'hero-advisory'
                      ? { color: '#ffffff' }
                      : (isDay ? { color: '#047857' } : { color: '#34d399' }),
                  ]}
                >
                  {isSpeaking && currentSpeakingId === 'hero-advisory' ? '🔊 Speaking... (Tap to Stop)' : '🔊 Listen (Audio Advisory)'}
                </Text>
                {isSpeaking && currentSpeakingId === 'hero-advisory' && (
                  <View style={S.audioWaveBarContainer}>
                    <View style={[S.audioWaveBar, Platform.OS === 'web' ? ({ className: 'audio-wave-anim-1' } as any) : {}]} />
                    <View style={[S.audioWaveBar, Platform.OS === 'web' ? ({ className: 'audio-wave-anim-2' } as any) : {}]} />
                    <View style={[S.audioWaveBar, Platform.OS === 'web' ? ({ className: 'audio-wave-anim-3' } as any) : {}]} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Main Headline with Day/Night Holographic Gradient */}
            <Text
              style={[
                S.heroMainTitle,
                isMobile && { fontSize: 32, lineHeight: 40 },
                isDay && S.heroMainTitleDay,
                Platform.OS === 'web' ? ({ className: isDay ? 'holo-day-title' : 'holo-night-title' } as any) : {},
              ]}
            >
              {t.heroTitle}
            </Text>

            {/* Sub-Headline */}
            <Text style={[S.heroSubTitle, isMobile && { fontSize: 14, lineHeight: 22 }, isDay && S.heroSubTitleDay]}>
              {t.heroSub}
            </Text>

            {/* ══ COMPACT 4D MANDI DIRECTORY TELEMETRY WIDGET ══ */}
            <View nativeID="mandi-rates" {...(Platform.OS === 'web' ? ({ id: 'mandi-rates' } as any) : {})} />
            <SpatialTiltCard
              style={[S.mandiDiscoveryCard, isDay && S.mandiDiscoveryCardDay]}
              glowColor={isDay ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.38)'}
              tiltMax={3}
              isInteractive={true}
            >
              {/* ── Top Header Row: Title & 4D Official Rates Action Button ── */}
              <View style={S.mandiHeaderRow}>
                <View style={S.mandiHeaderTitleGroup}>
                  <Ionicons name="trending-up" size={16} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[S.mandiCardTitle, isDay && S.mandiCardTitleDay]}>{t.instantMandi}</Text>
                  <View style={[S.liveBadgeMini, isDay && S.liveBadgeMiniDay]}>
                    <View style={S.pulseDot} />
                    <Text style={[S.liveBadgeMiniText, isDay && S.liveBadgeMiniTextDay]}>{t.liveApmc}</Text>
                  </View>
                </View>

                {/* ── 4D Official Rates Button ── */}
                <TouchableOpacity
                  style={[S.mandiRate4DBtn, isDay && S.mandiRate4DBtnDay]}
                  onPress={() => {
                    if (user) {
                      router.push('/(dashboard)');
                    } else {
                      setOfficialRatesModalVisible(true);
                    }
                  }}
                  activeOpacity={0.88}
                  // @ts-ignore
                  className="four-d-official-btn"
                >
                  <Ionicons name="shield-checkmark" size={12} color={isDay ? '#047857' : '#34d399'} />
                  <Text style={[S.mandiRate4DBtnText, isDay && S.mandiRate4DBtnTextDay]}>
                    {user ? t.myRates : t.officialRatesBtn}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Continuous Upward Live APMC Mandi Rate Board (Prices Move Upwards) ── */}
              <TouchableOpacity
                style={[S.mandiRollerSlot, isDay ? S.mandiRollerSlotDay : S.mandiRollerSlotNight]}
                activeOpacity={0.94}
                onPress={() => {
                  if (user) {
                    router.push('/(dashboard)');
                  } else {
                    setOfficialRatesModalVisible(true);
                  }
                }}
                // @ts-ignore
                className="mandi-vertical-ticker-window"
              >
                {/* Upward Scrolling Continuous Track */}
                <View
                  // @ts-ignore
                  className="mandi-vertical-ticker-track"
                >
                  {[...ALL_INDIA_LIVE_MANDI_FEED, ...ALL_INDIA_LIVE_MANDI_FEED].map((item, idx) => (
                    <View
                      key={`mandi-feed-${idx}`}
                      style={[S.mandiRollerRowItem, isDay && S.mandiRollerRowItemDay]}
                      // @ts-ignore
                      className="mandi-roller-row-item"
                    >
                      {/* Left: High-Contrast Crop Badge with Clear Name & Punjabi Subtitle */}
                      <View
                        style={[
                          S.rollerCropBadge,
                          isDay ? S.rollerCropBadgeDay : S.rollerCropBadgeNight,
                        ]}
                      >
                        <Text style={{ fontSize: isMobile ? 18 : 20 }}>{item.emoji}</Text>
                        <View style={{ flexDirection: 'column' }}>
                          <Text style={[S.rollerCropText, isDay ? S.rollerCropTextDay : S.rollerCropTextNight]}>
                            {item.crop}
                          </Text>
                          <Text style={[S.rollerVarietyText, isDay ? S.rollerVarietyTextDay : S.rollerVarietyTextNight]} numberOfLines={1}>
                            {item.variety}
                          </Text>
                        </View>
                      </View>

                      {/* Middle: Mandi & State */}
                      <View style={S.rollerMandiInfo}>
                        <Text style={[S.rollerMandiName, isDay && S.rollerMandiNameDay]} numberOfLines={1}>
                          📍 {item.mandi}
                        </Text>
                        <Text style={[S.rollerStateSub, isDay && S.rollerStateSubDay]} numberOfLines={1}>
                          {item.state} • {item.tag}
                        </Text>
                      </View>

                      {/* Right: Live Price & Up Trend (Moving Upwards) */}
                      <View style={S.rollerPriceGroup}>
                        <View style={S.rollerPriceValueRow}>
                          <Text style={[S.rollerPriceVal, isDay ? S.rollerPriceValDay : S.rollerPriceValNight]}>
                            {item.price}
                          </Text>
                          <Text style={[S.rollerPriceUnit, isDay && S.rollerPriceUnitDay]}>
                            /{item.unit}
                          </Text>
                        </View>
                        <View style={[S.rollerTrendPill, isDay ? S.rollerTrendPillDay : S.rollerTrendPillNight]}>
                          <Ionicons name="caret-up" size={11} color={isDay ? '#047857' : '#34d399'} />
                          <Text style={[S.rollerTrendText, isDay && S.rollerTrendTextDay]}>{item.change}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Top and Bottom Edge Smooth Gradient Masks */}
                {Platform.OS === 'web' && (
                  <>
                    <View
                      // @ts-ignore
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 12,
                        pointerEvents: 'none',
                        background: isDay
                          ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.95), transparent)'
                          : 'linear-gradient(180deg, rgba(3, 20, 14, 0.95), transparent)',
                        zIndex: 2,
                      }}
                    />
                    <View
                      // @ts-ignore
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 12,
                        pointerEvents: 'none',
                        background: isDay
                          ? 'linear-gradient(0deg, rgba(255, 255, 255, 0.95), transparent)'
                          : 'linear-gradient(0deg, rgba(3, 20, 14, 0.95), transparent)',
                        zIndex: 2,
                      }}
                    />
                  </>
                )}
              </TouchableOpacity>

              {/* ── Roller Micro Indicators (Continuous Sync & Live Upward Status) ── */}
              <View style={S.rollerIndicatorsRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="pulse" size={12} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[S.rollerCounterText, isDay && S.rollerCounterTextDay]}>
                    Live APMC Auction Radar • 9 Regional Mandis
                  </Text>
                </View>
                <View style={[S.upwardMovingIndicatorBadge, isDay ? S.upwardMovingIndicatorBadgeDay : S.upwardMovingIndicatorBadgeNight]}>
                  <Ionicons name="trending-up" size={11} color={isDay ? '#047857' : '#34d399'} />
                  <Text style={[S.upwardMovingIndicatorText, isDay ? S.upwardMovingIndicatorTextDay : S.upwardMovingIndicatorTextNight]}>
                    Prices Rising ↑
                  </Text>
                </View>
              </View>

              {/* ── Transparency & Trust Footer Strip ── */}
              <View style={[S.mandiVerifiedFooter, isDay && S.mandiVerifiedFooterDay]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="shield-checkmark" size={11} color={isDay ? '#047857' : '#34d399'} />
                  <Text style={[S.mandiVerifiedText, isDay && S.mandiVerifiedTextDay]}>
                    AGMARKNET & eNAM Synchronized Real-Time Feeds
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setOfficialRatesModalVisible(true)} activeOpacity={0.8}>
                  <Text style={[S.mandiVerifiedLink, isDay && S.mandiVerifiedLinkDay]}>
                    Verify Accuracy →
                  </Text>
                </TouchableOpacity>
              </View>
            </SpatialTiltCard>

            {/* ══ 4D OFFICIAL & ACCURATE RATES MODAL SHEET ══ */}
            <Modal
              visible={officialRatesModalVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setOfficialRatesModalVisible(false)}
            >
              <View style={S.modalBackdrop}>
                <View style={[S.officialModalCard, isDay && S.officialModalCardDay]}>
                  {/* Modal Header */}
                  <View style={S.officialModalHeader}>
                    <View style={S.officialModalHeaderLeft}>
                      <View style={[S.officialModalIconCircle, isDay && S.officialModalIconCircleDay]}>
                        <Ionicons name="shield-checkmark" size={20} color={isDay ? '#059669' : '#34d399'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[S.officialModalTitle, isDay && S.officialModalTitleDay]}>
                          {t.officialRatesModalTitle}
                        </Text>
                        <Text style={[S.officialModalSub, isDay && S.officialModalSubDay]}>
                          {t.officialRatesModalSub}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[S.officialModalCloseBtn, isDay && S.officialModalCloseBtnDay]}
                      onPress={() => setOfficialRatesModalVisible(false)}
                    >
                      <Ionicons name="close" size={18} color={isDay ? '#475569' : '#94a3b8'} />
                    </TouchableOpacity>
                  </View>

                  {/* Feature Perks List */}
                  <View style={[S.officialPerksList, isDay && S.officialPerksListDay]}>
                    {[
                      { icon: 'flash', text: t.officialRatesPerk1 },
                      { icon: 'checkmark-done-circle', text: t.officialRatesPerk2 },
                      { icon: 'call', text: t.officialRatesPerk3 },
                      { icon: 'notifications', text: t.officialRatesPerk4 },
                    ].map((perk, i) => (
                      <View key={i} style={S.officialPerkItem}>
                        <Ionicons name={perk.icon as any} size={15} color={isDay ? '#059669' : '#34d399'} />
                        <Text style={[S.officialPerkText, isDay && S.officialPerkTextDay]}>{perk.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={S.officialModalActions}>
                    <TouchableOpacity
                      style={S.officialModalPrimaryBtn}
                      onPress={() => {
                        setOfficialRatesModalVisible(false);
                        router.push('/(auth)/login');
                      }}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669', '#047857']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={S.officialModalPrimaryGradient}
                      >
                        <Ionicons name="log-in-outline" size={18} color="#ffffff" />
                        <Text style={S.officialModalPrimaryText}>{t.signInToUnlock}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[S.officialModalSecondaryBtn, isDay && S.officialModalSecondaryBtnDay]}
                      onPress={() => setOfficialRatesModalVisible(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={[S.officialModalSecondaryText, isDay && S.officialModalSecondaryTextDay]}>
                        {t.closePreview}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* ══ HIGH-CONVERTING UNIFIED HERO CTA (MERGED WITH "LOGIN FOR LIVE PRICES") ══ */}
            <View style={S.ctaRow}>
              <TouchableOpacity
                onPress={() => router.push(user ? '/(dashboard)' : '/(auth)/login')}
                activeOpacity={0.88}
                style={[
                  S.primaryBtnContainer,
                  S.primaryBtnContainerWide,
                  isDay ? S.primaryBtnContainerDay : S.primaryBtnContainerNight,
                  Platform.OS === 'web' ? ({ className: 'wide-glowing-get-started-btn' } as any) : {},
                ]}
              >
                <LinearGradient
                  colors={['#10b981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[S.btnPrimary, S.btnPrimaryWide]}
                >
                  <View style={S.btnPrimarySparkleWrap}>
                    <Ionicons name="sparkles" size={18} color="#fef08a" />
                  </View>
                  <View style={S.btnPrimaryTextBox}>
                    <Text style={S.btnPrimaryTextWide}>
                      {user ? 'Open Farmer Dashboard →' : 'Get Started Free • Login for Your Own Crop Live Prices'}
                    </Text>
                    <Text style={S.btnPrimarySubWide}>
                      Instant Live APMC Mandi Radar • 5-Sec AI Crop Doctor • Certified Agri Store
                    </Text>
                  </View>
                  <View style={S.btnPrimaryArrowPill}>
                    <Ionicons name="arrow-forward" size={15} color="#ffffff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.btnSecondary, isDay && S.btnSecondaryDay]}
                onPress={() => router.push('/shop')}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={16} color={isDay ? '#0284c7' : '#bae6fd'} />
                <Text style={[S.btnSecondaryText, isDay && S.btnSecondaryTextDay]}>{t.exploreStore}</Text>
              </TouchableOpacity>
            </View>

            {/* Trust Stats Bar */}
            <View style={[S.trustStatsBar, isDay && S.trustStatsBarDay]}>
              <View style={S.statItem}>
                <Text style={[S.statNum, { color: isDay ? '#059669' : '#a7f3d0' }]}>50,000+</Text>
                <Text style={[S.statLabel, isDay && S.statLabelDay]}>{t.cultivators}</Text>
              </View>
              <View style={[S.statDivider, isDay && S.statDividerDay]} />
              <View style={S.statItem}>
                <Text style={[S.statNum, { color: isDay ? '#0284c7' : '#bae6fd' }]}>₹14.8 Cr+</Text>
                <Text style={[S.statLabel, isDay && S.statLabelDay]}>{t.traded}</Text>
              </View>
              <View style={[S.statDivider, isDay && S.statDividerDay]} />
              <View style={S.statItem}>
                <Text style={[S.statNum, { color: isDay ? '#d97706' : '#fde68a' }]}>1,200+</Text>
                <Text style={[S.statLabel, isDay && S.statLabelDay]}>{t.agronomists}</Text>
              </View>
            </View>
          </View>

          {/* Right Column: Clean 3D Living Showcase Frame with Drone Spray Mist, Farmer Tablet Scan HUD, and Breeze Motion */}
          <View style={[S.heroRight, isDesktop ? { flex: 5 } : { width: '100%', marginTop: 16 }]}>
            <SpatialTiltCard
              style={[S.showcaseFrame, isDay && S.showcaseFrameDay]}
              glowColor={isDay ? 'rgba(16, 185, 129, 0.25)' : 'rgba(167, 243, 208, 0.4)'}
              tiltMax={5}
            >
              {/* ── Top Micro-Telemetry HUD Strip ── */}
              <View style={[S.showcaseTopBar, isDay && S.showcaseTopBarDay]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={S.showcaseLiveDot} />
                  <Text style={[S.showcaseTopText, isDay && S.showcaseTopTextDay]}>
                    AI SMART FARM • LIVE TELEMETRY
                  </Text>
                </View>
                <View style={[S.showcaseGpsBadge, isDay && S.showcaseGpsBadgeDay]}>
                  <Text style={[S.showcaseGpsText, isDay && S.showcaseGpsTextDay]}>
                    DRONE SPRAY: 3.2L/MIN
                  </Text>
                </View>
              </View>

              {/* ── Main Living Smart Farm Image with Living Cinemagraph Layers ── */}
              <View style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                {/* 1. Base Image with Organic Wind Breeze Breathing */}
                <Image
                  source={require('@/assets/images/user_smart_farm_bg.jpg')}
                  style={[
                    isMobile ? S.showcaseImageMobile : S.showcaseImageDesktop,
                    Platform.OS === 'web'
                      ? ({
                          animation: 'livingFarmBreeze 8s ease-in-out infinite alternate',
                          transformOrigin: '50% 80%',
                          willChange: 'transform',
                        } as any)
                      : {},
                  ]}
                  resizeMode="cover"
                />

                {/* 2. Web Cinemagraph Animated Overlays (Direct Web Elements with Inline Styles) */}
                {Platform.OS === 'web' && (
                  <>
                    {/* Drone Aerosol Fertilizer / Spray Mist Cone */}
                    <div
                      className="drone-mist-spray"
                      style={{
                        position: 'absolute',
                        left: '32%',
                        top: '12%',
                        width: '15%',
                        height: '35%',
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(224, 242, 254, 0.92) 0%, rgba(186, 230, 253, 0.55) 45%, rgba(56, 189, 248, 0.25) 70%, transparent 85%)',
                        clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
                        WebkitClipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
                        animation: 'droneSprayCascade 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                        pointerEvents: 'none',
                        zIndex: 15,
                      }}
                    />

                    {/* Drone Spray Mist Secondary Droplet Drift */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '35.5%',
                        top: '20%',
                        width: '8%',
                        height: '25%',
                        background: 'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0px, transparent 4px, rgba(224, 242, 254, 0.5) 8px, transparent 12px)',
                        animation: 'droneSprayDrift 1.8s linear infinite',
                        pointerEvents: 'none',
                        zIndex: 16,
                      }}
                    />

                    {/* Drone Navigation Strobes */}
                    <div
                      className="drone-strobe-green"
                      style={{
                        position: 'absolute',
                        left: '42.6%',
                        top: '7.8%',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#34d399',
                        boxShadow: '0 0 12px #34d399, 0 0 20px #10b981',
                        animation: 'droneStrobePulse 1.8s infinite',
                        pointerEvents: 'none',
                        zIndex: 18,
                      }}
                    />
                    <div
                      className="drone-strobe-white"
                      style={{
                        position: 'absolute',
                        left: '33.8%',
                        top: '7.8%',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 0 12px #ffffff, 0 0 20px #38bdf8',
                        animation: 'droneStrobePulse 1.8s infinite 0.9s',
                        pointerEvents: 'none',
                        zIndex: 18,
                      }}
                    />

                    {/* Farmer Tablet Holographic Screen Glow */}
                    <div
                      className="farmer-tablet-glow"
                      style={{
                        position: 'absolute',
                        left: '63.8%',
                        top: '32%',
                        width: '14px',
                        height: '11px',
                        borderRadius: '3px',
                        background: '#38bdf8',
                        boxShadow: '0 0 14px #38bdf8, 0 0 24px rgba(56, 189, 248, 0.9)',
                        animation: 'tabletScreenPulse 2s ease-in-out infinite',
                        pointerEvents: 'none',
                        zIndex: 18,
                      }}
                    />

                    {/* Farmer Crop Scanning Laser Fan Cone */}
                    <div
                      className="farmer-scan-cone"
                      style={{
                        position: 'absolute',
                        left: '52%',
                        top: '28%',
                        width: '18%',
                        height: '28%',
                        transformOrigin: '75% 20%',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.6) 0%, rgba(52, 211, 153, 0.35) 45%, transparent 80%)',
                        clipPath: 'polygon(75% 20%, 0% 100%, 100% 100%)',
                        WebkitClipPath: 'polygon(75% 20%, 0% 100%, 100% 100%)',
                        animation: 'tabletScanFanSweep 3.6s ease-in-out infinite',
                        pointerEvents: 'none',
                        zIndex: 16,
                      }}
                    />

                    {/* Crop Telemetry Target Ring 1 (Vegetables Bed) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '49%',
                        top: '40%',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1.5px solid #34d399',
                        boxShadow: '0 0 10px rgba(52, 211, 153, 0.7)',
                        animation: 'cropTargetPing 2.4s ease-out infinite',
                        pointerEvents: 'none',
                        zIndex: 17,
                      }}
                    />

                    {/* Crop Telemetry Target Ring 2 (Golden Wheat) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '82%',
                        top: '52%',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1.5px solid #fde047',
                        boxShadow: '0 0 10px rgba(253, 224, 71, 0.7)',
                        animation: 'cropTargetPing 2.4s ease-out infinite 1.2s',
                        pointerEvents: 'none',
                        zIndex: 17,
                      }}
                    />

                    {/* Drifting Golden Sunbeam Pollen / Flower Micro Particles */}
                    <div
                      className="pollen-particle pollen-1"
                      style={{
                        position: 'absolute',
                        left: '12%',
                        top: '68%',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        boxShadow: '0 0 10px #fde047',
                        animation: 'pollenSunDrift1 6s linear infinite',
                        pointerEvents: 'none',
                        zIndex: 17,
                      }}
                    />
                    <div
                      className="pollen-particle pollen-2"
                      style={{
                        position: 'absolute',
                        left: '26%',
                        top: '76%',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#fde047',
                        boxShadow: '0 0 8px #fde047',
                        animation: 'pollenSunDrift2 5.5s linear infinite 1.8s',
                        pointerEvents: 'none',
                        zIndex: 17,
                      }}
                    />
                    <div
                      className="pollen-particle pollen-3"
                      style={{
                        position: 'absolute',
                        left: '44%',
                        top: '58%',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#fef08a',
                        boxShadow: '0 0 10px #fde047',
                        animation: 'pollenSunDrift1 7s linear infinite 3.2s',
                        pointerEvents: 'none',
                        zIndex: 17,
                      }}
                    />
                    <div
                      className="pollen-particle pollen-4"
                      style={{
                        position: 'absolute',
                        left: '70%',
                        top: '72%',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#fde047',
                        boxShadow: '0 0 8px #fde047',
                        animation: 'pollenSunDrift2 6.5s linear infinite 1.4s',
                        pointerEvents: 'none',
                        zIndex: 17,
                      }}
                    />

                    {/* 4D Animated Cyber Laser Beam */}
                    <div className="cyber-laser-beam" />

                    {/* 4D Radar Targeting HUD */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                      <div className="radar-target-circle">
                        <div className="radar-center-dot" />
                      </div>
                      <div className="radar-pulse-ring" />
                    </div>
                  </>
                )}

                {/* 3. Floating Holographic Crop Telemetry Pin (Near bottom wheat field) */}
                <View style={[S.overlayTelemetryBadge, isDay && S.overlayTelemetryBadgeDay]}>
                  <View style={S.overlayPulseDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={[S.overlayBadgeTitle, isDay && S.overlayBadgeTitleDay]}>
                      Crop Health: 98.4% Optimal
                    </Text>
                    <Text style={[S.overlayBadgeSub, isDay && S.overlayBadgeSubDay]}>
                      Moisture: 42% • Soil Nitrogen: Balanced • GPS Live
                    </Text>
                  </View>
                  <View style={[S.telemetrySignalBadge, isDay && S.telemetrySignalBadgeDay]}>
                    <Ionicons name="wifi" size={10} color={isDay ? '#047857' : '#a7f3d0'} />
                    <Text style={[S.telemetrySignalText, isDay && S.telemetrySignalTextDay]}>AI 60fps</Text>
                  </View>
                </View>
              </View>
            </SpatialTiltCard>
          </View>
        </View>

        {/* ══ THE 4 ICONIC FROSTED GLASS CARDS (3D TILT + BABY LIGHT PASTELS) ══ */}
        <View style={S.pillarsSection}>
          <View style={S.sectionHeader}>
            <View style={[S.sectionBadgeRow, isDay && S.sectionBadgeRowDay]}>
              <View style={[S.sectionBadgeDot, isDay && S.sectionBadgeDotDay]} />
              <Text style={[S.sectionEyebrow, isDay && S.sectionEyebrowDay]}>INTEGRATED AGRI ECOSYSTEM</Text>
            </View>
            <Text style={[S.sectionHeadline, isDay && S.sectionHeadlineDay]}>{t.fourPillarsTitle}</Text>
            <Text style={[S.sectionSubhead, isDay && S.sectionSubheadDay]}>
              {t.fourPillarsSub}
            </Text>
          </View>

          <View style={S.fourCardsRow}>
            {/* ══ Card 1: Farming (Exact Original Picture Glass Style) ══ */}
            <SpatialTiltCard
              style={[
                S.pillarCardOrig,
                isTablet && S.pillarCardOrigTablet,
                isMobile && S.pillarCardOrigMobile,
                isDay ? S.pillarCardOrigDay : null,
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day' : 'orig-glass-card' } as any) : {},
              ]}
              glowColor={isDay ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.45)'}
              tiltMax={7}
              onPress={() => router.push('/topic/Farming')}
            >
              {/* Luminous Neon Top Flare */}
              <View style={[S.cardFlareTop, { backgroundColor: isDay ? '#f59e0b' : '#fb923c', shadowColor: '#f59e0b' }]} />

              {/* Top-Right Circular Frosted Chevron Badge */}
              <TouchableOpacity
                style={[
                  S.origCardArrowBadge,
                  isDay && S.origCardArrowBadgeDay,
                  Platform.OS === 'web' ? ({ className: 'orig-chevron-btn' } as any) : {},
                ]}
                onPress={() => router.push('/topic/Farming')}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={13} color={isDay ? '#334155' : 'rgba(255, 255, 255, 0.95)'} />
              </TouchableOpacity>

              {/* 3D Smart Tractor + Mixed Color Ambient Stage */}
              <View
                style={[
                  S.pillarThumbBox,
                  isDay ? S.pillarThumbBoxDay : S.pillarThumbBoxNight,
                  isDay ? S.thumbBoxFarmingDay : S.thumbBoxFarmingNight,
                  Platform.OS === 'web'
                    ? ({ className: isDay ? 'pillar-thumb-box thumb-box-farming-day' : 'pillar-thumb-box thumb-box-farming' } as any)
                    : {},
                ]}
              >
                <Image
                  source={require('@/assets/images/icon_farming_3d_clean.png')}
                  style={[
                    S.pillarThumbImg,
                    Platform.OS === 'web' ? ({ className: 'pillar-thumb-img' } as any) : {},
                  ]}
                  resizeMode="contain"
                />
              </View>

              <Text style={[S.origCardTitle, isDay && S.origCardTitleDay]}>Farming</Text>

              {/* Highlight Micro Value Badge */}
              <View style={[S.pillarMicroBadge, isDay ? S.pillarMicroBadgeFarmingDay : S.pillarMicroBadgeFarmingNight]}>
                <Ionicons name="hardware-chip" size={11} color={isDay ? '#d97706' : '#fbbf24'} />
                <Text style={[S.pillarMicroBadgeText, isDay ? S.pillarMicroBadgeTextFarmingDay : S.pillarMicroBadgeTextFarmingNight]}>
                  Precision Drone Spraying
                </Text>
              </View>

              <Text style={[S.origCardSubtitle, isDay && S.origCardSubtitleDay]}>
                Precision Agriculture, Yield Max, Resource Efficiency.
              </Text>

              {/* Exact Frosted Pill Button (Left-Aligned, Compact) */}
              <TouchableOpacity
                style={[
                  S.origPillBtn,
                  isDay ? S.origPillBtnFarmingDay : S.origPillBtnFarming,
                  Platform.OS === 'web' ? ({ className: isDay ? 'orig-pill-btn-day' : 'orig-pill-btn' } as any) : {},
                ]}
                onPress={() => router.push('/topic/Farming')}
                activeOpacity={0.85}
              >
                <Text style={[S.origPillBtnText, isDay && S.origPillBtnFarmingTextDay]}>Learn More</Text>
              </TouchableOpacity>

              {/* Soft Bottom Glow Flare */}
              <View style={[S.cardFlareBottom, { backgroundColor: '#f59e0b', shadowColor: '#f59e0b' }]} />
            </SpatialTiltCard>

            {/* ══ Card 2: Gardening (Exact Original Picture Glass Style) ══ */}
            <SpatialTiltCard
              style={[
                S.pillarCardOrig,
                isTablet && S.pillarCardOrigTablet,
                isMobile && S.pillarCardOrigMobile,
                isDay ? S.pillarCardOrigDay : null,
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day' : 'orig-glass-card' } as any) : {},
              ]}
              glowColor={isDay ? 'rgba(244, 114, 182, 0.28)' : 'rgba(244, 114, 182, 0.45)'}
              tiltMax={7}
              onPress={() => router.push('/topic/Gardening')}
            >
              {/* Luminous Neon Top Flare (Soft Lavender/White sheen) */}
              <View style={[S.cardFlareTop, { backgroundColor: isDay ? '#ec4899' : '#fdf4ff', shadowColor: '#f472b6' }]} />

              {/* Top-Right Circular Frosted Chevron Badge */}
              <TouchableOpacity
                style={[
                  S.origCardArrowBadge,
                  isDay && S.origCardArrowBadgeDay,
                  Platform.OS === 'web' ? ({ className: 'orig-chevron-btn' } as any) : {},
                ]}
                onPress={() => router.push('/topic/Gardening')}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={13} color={isDay ? '#334155' : 'rgba(255, 255, 255, 0.95)'} />
              </TouchableOpacity>

              {/* 3D Blooming Rose + Mixed Color Botanical Stage */}
              <View
                style={[
                  S.pillarThumbBox,
                  isDay ? S.pillarThumbBoxDay : S.pillarThumbBoxNight,
                  isDay ? S.thumbBoxGardeningDay : S.thumbBoxGardeningNight,
                  Platform.OS === 'web'
                    ? ({ className: isDay ? 'pillar-thumb-box thumb-box-gardening-day' : 'pillar-thumb-box thumb-box-gardening' } as any)
                    : {},
                ]}
              >
                <Image
                  source={require('@/assets/images/icon_gardening_3d_clean.png')}
                  style={[
                    S.pillarThumbImg,
                    Platform.OS === 'web' ? ({ className: 'pillar-thumb-img' } as any) : {},
                  ]}
                  resizeMode="contain"
                />
              </View>

              <Text style={[S.origCardTitle, isDay && S.origCardTitleDay]}>Gardening</Text>

              {/* Highlight Micro Value Badge */}
              <View style={[S.pillarMicroBadge, isDay ? S.pillarMicroBadgeGardeningDay : S.pillarMicroBadgeGardeningNight]}>
                <Ionicons name="flower" size={11} color={isDay ? '#db2777' : '#f472b6'} />
                <Text style={[S.pillarMicroBadgeText, isDay ? S.pillarMicroBadgeTextGardeningDay : S.pillarMicroBadgeTextGardeningNight]}>
                  Home Plant Care & Pots
                </Text>
              </View>

              <Text style={[S.origCardSubtitle, isDay && S.origCardSubtitleDay]}>
                Home Gardening Kits, Urban Farming Solutions, Plant Care.
              </Text>

              {/* Exact Frosted Pill Button (Left-Aligned, Compact) */}
              <TouchableOpacity
                style={[
                  S.origPillBtn,
                  isDay ? S.origPillBtnGardeningDay : S.origPillBtnGardening,
                  Platform.OS === 'web' ? ({ className: isDay ? 'orig-pill-btn-day' : 'orig-pill-btn' } as any) : {},
                ]}
                onPress={() => router.push('/topic/Gardening')}
                activeOpacity={0.85}
              >
                <Text style={[S.origPillBtnText, isDay && S.origPillBtnGardeningTextDay]}>Learn More</Text>
              </TouchableOpacity>

              {/* Soft Bottom Glow Flare */}
              <View style={[S.cardFlareBottom, { backgroundColor: '#f472b6', shadowColor: '#f472b6' }]} />
            </SpatialTiltCard>

            {/* ══ Card 3: Crop Doctors (Exact Original Picture Glass Style) ══ */}
            <SpatialTiltCard
              style={[
                S.pillarCardOrig,
                isTablet && S.pillarCardOrigTablet,
                isMobile && S.pillarCardOrigMobile,
                isDay ? S.pillarCardOrigDay : null,
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day' : 'orig-glass-card' } as any) : {},
              ]}
              glowColor={isDay ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.45)'}
              tiltMax={7}
            >
              {/* Luminous Neon Top Flare (Radiant Emerald) */}
              <View style={[S.cardFlareTop, { backgroundColor: '#10b981', shadowColor: '#10b981' }]} />

              {/* Top-Right Circular Frosted Chevron Badge */}
              <TouchableOpacity
                style={[
                  S.origCardArrowBadge,
                  isDay && S.origCardArrowBadgeDay,
                  Platform.OS === 'web' ? ({ className: 'orig-chevron-btn' } as any) : {},
                ]}
                onPress={() => router.push('/topic/Crop-Doctors')}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={13} color={isDay ? '#334155' : 'rgba(255, 255, 255, 0.95)'} />
              </TouchableOpacity>

              {/* 3D Bio Microscope + Mixed Color Laboratory Stage */}
              <View
                style={[
                  S.pillarThumbBox,
                  isDay ? S.pillarThumbBoxDay : S.pillarThumbBoxNight,
                  isDay ? S.thumbBoxCropDoctorsDay : S.thumbBoxCropDoctorsNight,
                  Platform.OS === 'web'
                    ? ({ className: isDay ? 'pillar-thumb-box thumb-box-cropdoctors-day' : 'pillar-thumb-box thumb-box-cropdoctors' } as any)
                    : {},
                ]}
              >
                <Image
                  source={require('@/assets/images/icon_cropdoctors_3d_clean.png')}
                  style={[
                    S.pillarThumbImg,
                    Platform.OS === 'web' ? ({ className: 'pillar-thumb-img' } as any) : {},
                  ]}
                  resizeMode="contain"
                />
              </View>

              <Text style={[S.origCardTitle, isDay && S.origCardTitleDay]}>Crop Doctors</Text>

              {/* Highlight Micro Value Badge */}
              <View style={[S.pillarMicroBadge, isDay ? S.pillarMicroBadgeCropDoctorsDay : S.pillarMicroBadgeCropDoctorsNight]}>
                <Ionicons name="scan" size={11} color={isDay ? '#059669' : '#34d399'} />
                <Text style={[S.pillarMicroBadgeText, isDay ? S.pillarMicroBadgeTextCropDoctorsDay : S.pillarMicroBadgeTextCropDoctorsNight]}>
                  Instant 5-Sec AI Leaf Diagnostic
                </Text>
              </View>

              <Text style={[S.origCardSubtitle, isDay && S.origCardSubtitleDay]}>
                AI Disease Diagnosis, Expert Consultations, Soil Analysis.
              </Text>

              {/* Exact Frosted Pill Button (Left-Aligned, Compact) */}
              <TouchableOpacity
                style={[
                  S.origPillBtn,
                  isDay ? S.origPillBtnCropDoctorsDay : S.origPillBtnCropDoctors,
                  Platform.OS === 'web' ? ({ className: isDay ? 'orig-pill-btn-day' : 'orig-pill-btn' } as any) : {},
                ]}
                onPress={() => router.push('/topic/Crop-Doctors')}
                activeOpacity={0.85}
              >
                <Text style={[S.origPillBtnText, isDay && S.origPillBtnCropDoctorsTextDay]}>Learn More</Text>
              </TouchableOpacity>

              {/* Soft Bottom Glow Flare */}
              <View style={[S.cardFlareBottom, { backgroundColor: '#10b981', shadowColor: '#10b981' }]} />
            </SpatialTiltCard>

            {/* ══ Card 4: Agri Store (Exact Original Picture Glass Style) ══ */}
            <SpatialTiltCard
              style={[
                S.pillarCardOrig,
                isTablet && S.pillarCardOrigTablet,
                isMobile && S.pillarCardOrigMobile,
                isDay ? S.pillarCardOrigDay : null,
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day' : 'orig-glass-card' } as any) : {},
              ]}
              glowColor={isDay ? 'rgba(14, 165, 233, 0.28)' : 'rgba(45, 212, 191, 0.45)'}
              tiltMax={7}
              onPress={() => router.push('/shop')}
            >
              {/* Luminous Neon Top Flare */}
              <View style={[S.cardFlareTop, { backgroundColor: isDay ? '#0284c7' : '#2dd4bf', shadowColor: '#06b6d4' }]} />

              {/* Top-Right Circular Frosted Chevron Badge */}
              <TouchableOpacity
                style={[
                  S.origCardArrowBadge,
                  isDay && S.origCardArrowBadgeDay,
                  Platform.OS === 'web' ? ({ className: 'orig-chevron-btn' } as any) : {},
                ]}
                onPress={() => router.push('/shop')}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={13} color={isDay ? '#334155' : 'rgba(255, 255, 255, 0.95)'} />
              </TouchableOpacity>

              {/* 3D Shopping Cart + Mixed Color Marketplace Stage */}
              <View
                style={[
                  S.pillarThumbBox,
                  isDay ? S.pillarThumbBoxDay : S.pillarThumbBoxNight,
                  isDay ? S.thumbBoxAgriStoreDay : S.thumbBoxAgriStoreNight,
                  Platform.OS === 'web'
                    ? ({ className: isDay ? 'pillar-thumb-box thumb-box-agristore-day' : 'pillar-thumb-box thumb-box-agristore' } as any)
                    : {},
                ]}
              >
                <Image
                  source={require('@/assets/images/icon_agristore_3d_clean.png')}
                  style={[
                    S.pillarThumbImg,
                    Platform.OS === 'web' ? ({ className: 'pillar-thumb-img' } as any) : {},
                  ]}
                  resizeMode="contain"
                />
              </View>

              <Text style={[S.origCardTitle, isDay && S.origCardTitleDay]}>Agri Store</Text>

              {/* Highlight Micro Value Badge */}
              <View style={[S.pillarMicroBadge, isDay ? S.pillarMicroBadgeAgriStoreDay : S.pillarMicroBadgeAgriStoreNight]}>
                <Ionicons name="ribbon" size={11} color={isDay ? '#0284c7' : '#38bdf8'} />
                <Text style={[S.pillarMicroBadgeText, isDay ? S.pillarMicroBadgeTextAgriStoreDay : S.pillarMicroBadgeTextAgriStoreNight]}>
                  500+ Certified Seeds & Organic Food
                </Text>
              </View>

              <Text style={[S.origCardSubtitle, isDay && S.origCardSubtitleDay]}>
                Certified Seeds, Fertilizers, Farmer Made Food & Organic Products.
              </Text>

              {/* Exact Frosted Pill Button (Left-Aligned, Compact) */}
              <TouchableOpacity
                style={[
                  S.origPillBtn,
                  isDay ? S.origPillBtnAgriStoreDay : S.origPillBtnAgriStore,
                  Platform.OS === 'web' ? ({ className: isDay ? 'orig-pill-btn-day' : 'orig-pill-btn' } as any) : {},
                ]}
                onPress={() => router.push('/shop')}
                activeOpacity={0.85}
              >
                <Text style={[S.origPillBtnText, isDay && S.origPillBtnAgriStoreTextDay]}>Learn More</Text>
              </TouchableOpacity>

              {/* Soft Bottom Glow Flare */}
              <View style={[S.cardFlareBottom, { backgroundColor: '#14b8a6', shadowColor: '#14b8a6' }]} />
            </SpatialTiltCard>
          </View>
        </View>

        {/* ══ INTERACTIVE 5-SECOND AI PLANT DOCTOR DEMO WIDGET ══ */}
        <View style={S.aiDoctorDemoSection}>
          <SpatialTiltCard
            style={[S.aiDoctorDemoCard, isDay ? S.aiDoctorDemoCardDay : S.aiDoctorDemoCardNight]}
            glowColor={isDay ? 'rgba(16, 185, 129, 0.25)' : 'rgba(52, 211, 153, 0.35)'}
            tiltMax={4}
          >
            {/* Header Badge & Title */}
            <View style={S.aiDoctorHeader}>
              <View style={[S.aiDoctorBadge, isDay ? S.aiDoctorBadgeDay : S.aiDoctorBadgeNight]}>
                <Ionicons name="sparkles" size={13} color={isDay ? '#059669' : '#34d399'} />
                <Text style={[S.aiDoctorBadgeText, isDay ? S.aiDoctorBadgeTextDay : S.aiDoctorBadgeTextNight]}>
                  INSTANT PLANT PATHOLOGY LAB
                </Text>
                <View style={S.aiDoctorLiveTag}>
                  <View style={S.pulseDot} />
                  <Text style={S.aiDoctorLiveTagText}>5-SEC AI SCAN</Text>
                </View>
              </View>

              <Text style={[S.aiDoctorTitle, isDay ? S.aiDoctorTitleDay : S.aiDoctorTitleNight]}>
                Try 5-Second AI Doctor Demo
              </Text>
              <Text style={[S.aiDoctorSubhead, isDay ? S.aiDoctorSubheadDay : S.aiDoctorSubheadNight]}>
                Tap any sample diseased leaf below to simulate a real-time field diagnosis and instant tank prescription:
              </Text>
            </View>

            {/* 3 Sample Leaf Selector Tabs */}
            <View style={S.aiDoctorSamplesGrid}>
              {AI_DOCTOR_SAMPLES.map((sample, idx) => {
                const isSelected = selectedAiSampleId === sample.id;
                return (
                  <TouchableOpacity
                    key={sample.id}
                    style={[
                      S.aiDoctorSampleTab,
                      isDay ? S.aiDoctorSampleTabDay : S.aiDoctorSampleTabNight,
                      isSelected && (isDay ? S.aiDoctorSampleTabActiveDay : S.aiDoctorSampleTabActiveNight),
                      isSelected && { borderColor: sample.color },
                    ]}
                    onPress={() => handleSelectAiSample(sample.id)}
                    activeOpacity={0.85}
                  >
                    <View style={S.aiDoctorSampleTabTop}>
                      <Text style={{ fontSize: 24 }}>{sample.leafEmoji}</Text>
                      <View style={[S.aiDoctorSampleNumBadge, { backgroundColor: `${sample.color}25` }]}>
                        <Text style={[S.aiDoctorSampleNumText, { color: sample.color }]}>
                          Sample {idx + 1}
                        </Text>
                      </View>
                    </View>
                    <Text style={[S.aiDoctorSampleCrop, isDay ? S.aiDoctorSampleCropDay : S.aiDoctorSampleCropNight]}>
                      {sample.crop}
                    </Text>
                    <Text style={[S.aiDoctorSampleDisease, { color: sample.color }]}>
                      {sample.disease}
                    </Text>
                    <Text style={[S.aiDoctorSamplePunjabi, isDay ? S.aiDoctorSamplePunjabiDay : S.aiDoctorSamplePunjabiNight]}>
                      ({sample.punjabiName})
                    </Text>
                    <View style={[S.aiDoctorTapPill, isSelected && { backgroundColor: sample.color }]}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'finger-print-outline'}
                        size={12}
                        color={isSelected ? '#ffffff' : (isDay ? '#64748b' : '#94a3b8')}
                      />
                      <Text
                        style={[
                          S.aiDoctorTapPillText,
                          isSelected
                            ? { color: '#ffffff', fontFamily: FONT.extraBold }
                            : (isDay ? { color: '#64748b' } : { color: '#94a3b8' }),
                        ]}
                      >
                        {isSelected ? 'Selected' : 'Tap to Scan'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Interactive Scanner & Diagnostic Output Display */}
            <View style={[S.aiScannerViewport, isDay ? S.aiScannerViewportDay : S.aiScannerViewportNight]}>
              {/* If Scanning: Cyber Laser Sweep & Telemetry */}
              {isAiScanning ? (
                <View style={S.aiScanningStateBox}>
                  {Platform.OS === 'web' && <div className="ai-doctor-laser-beam" />}
                  <View style={S.aiScanningCenterBox}>
                    <Text style={{ fontSize: 48, marginBottom: 8 }}>{activeAiSample.leafEmoji}</Text>
                    <View style={S.aiScanningStatusRow}>
                      <Ionicons name="scan" size={16} color="#38bdf8" />
                      <Text style={S.aiScanningStatusText}>
                        Laser Scanning Cellular Chloroplast & Fungal Morphology... [{aiScanProgress}%]
                      </Text>
                    </View>
                    {/* Progress Bar */}
                    <View style={S.aiProgressBarBg}>
                      <View style={[S.aiProgressBarFill, { width: `${aiScanProgress}%`, backgroundColor: activeAiSample.color }]} />
                    </View>
                  </View>
                </View>
              ) : (
                /* Diagnostic Report Result */
                <View style={S.aiDiagnosticReportBox}>
                  {/* Top Report Header */}
                  <View style={S.aiReportTopRow}>
                    <View style={S.aiReportTitleCol}>
                      <View style={S.aiReportVerifiedRow}>
                        <Ionicons name="checkmark-done-circle" size={18} color="#10b981" />
                        <Text style={S.aiReportBadgeText}>CONFIRMED PATHOGEN DIAGNOSIS</Text>
                        <View style={[S.aiAccuracyPill, { backgroundColor: `${activeAiSample.color}25` }]}>
                          <Text style={[S.aiAccuracyText, { color: activeAiSample.color }]}>
                            {activeAiSample.accuracy} AI Confidence
                          </Text>
                        </View>
                      </View>
                      <Text style={[S.aiDiseaseHeadline, isDay ? S.aiDiseaseHeadlineDay : S.aiDiseaseHeadlineNight]}>
                        {activeAiSample.disease}
                      </Text>
                      <Text style={[S.aiDiseaseSubline, isDay ? S.aiDiseaseSublineDay : S.aiDiseaseSublineNight]}>
                        {activeAiSample.punjabiName} • Pathogen: <Text style={{ fontStyle: 'italic' }}>{activeAiSample.pathogen}</Text>
                      </Text>
                    </View>
                    <View style={S.aiCropEmojiBadge}>
                      <Text style={{ fontSize: 32 }}>{activeAiSample.leafEmoji}</Text>
                    </View>
                  </View>

                  {/* Prescription & Tank Dosage Grid */}
                  <View style={S.aiPrescriptionGrid}>
                    {/* Card A: Prescribed Medicine */}
                    <View style={[S.aiPrescriptionCard, isDay ? S.aiPrescriptionCardDay : S.aiPrescriptionCardNight]}>
                      <View style={S.aiPrescriptionCardHeader}>
                        <Ionicons name="medkit" size={15} color="#059669" />
                        <Text style={S.aiPrescriptionCardHeaderLabel}>RECOMMENDED LAB MEDICINE</Text>
                      </View>
                      <Text style={[S.aiPrescriptionMedicineName, isDay ? S.aiPrescriptionMedicineNameDay : S.aiPrescriptionMedicineNameNight]}>
                        {activeAiSample.medicine}
                      </Text>
                      <Text style={S.aiPrescriptionSymptomsText}>
                        Symptoms: {activeAiSample.symptoms}
                      </Text>
                    </View>

                    {/* Card B: Exact Dosage & Timing */}
                    <View style={[S.aiPrescriptionCard, isDay ? S.aiPrescriptionCardDay : S.aiPrescriptionCardNight]}>
                      <View style={S.aiPrescriptionCardHeader}>
                        <Ionicons name="water" size={15} color="#0284c7" />
                        <Text style={[S.aiPrescriptionCardHeaderLabel, { color: '#0284c7' }]}>FIELD TANK DOSAGE RATIO</Text>
                      </View>
                      <Text style={[S.aiPrescriptionDosageValue, isDay ? S.aiPrescriptionDosageValueDay : S.aiPrescriptionDosageValueNight]}>
                        {activeAiSample.dosage}
                      </Text>
                      <Text style={S.aiPrescriptionSymptomsText}>
                        Timing: {activeAiSample.prevention}
                      </Text>
                    </View>
                  </View>

                  {/* High-Converting Action Buttons & Audio Readout */}
                  <View style={S.aiDoctorActionButtonsRow}>
                    <TouchableOpacity
                      style={S.aiDoctorOrderBtn}
                      onPress={() => router.push(`/shop?q=${encodeURIComponent(activeAiSample.shopQuery)}` as any)}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={S.aiDoctorOrderGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="cart" size={16} color="#ffffff" />
                        <Text style={S.aiDoctorOrderBtnText}>
                          Order Verified Medicine from Agri Store →
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* 🔊 Audio Readout Button */}
                    <TouchableOpacity
                      style={[
                        S.aiDoctorAudioBtn,
                        isSpeaking && currentSpeakingId === `ai-doc-${activeAiSample.id}`
                          ? S.aiDoctorAudioBtnPlaying
                          : (isDay ? S.aiDoctorAudioBtnDay : S.aiDoctorAudioBtnNight),
                      ]}
                      onPress={() => {
                        speakText(activeAiSample.audioNarrationEnglish, `ai-doc-${activeAiSample.id}`);
                      }}
                      activeOpacity={0.85}
                      accessibilityLabel="Listen to crop disease diagnosis aloud"
                    >
                      <Ionicons
                        name={isSpeaking && currentSpeakingId === `ai-doc-${activeAiSample.id}` ? 'volume-high' : 'volume-medium-outline'}
                        size={16}
                        color={isSpeaking && currentSpeakingId === `ai-doc-${activeAiSample.id}` ? '#ffffff' : (isDay ? '#047857' : '#34d399')}
                      />
                      <Text
                        style={[
                          S.aiDoctorAudioBtnText,
                          isSpeaking && currentSpeakingId === `ai-doc-${activeAiSample.id}`
                            ? { color: '#ffffff' }
                            : (isDay ? { color: '#047857' } : { color: '#34d399' }),
                        ]}
                      >
                        {isSpeaking && currentSpeakingId === `ai-doc-${activeAiSample.id}`
                          ? '🔊 Speaking... (Tap to Stop)'
                          : '🔊 Listen to Diagnosis (Audio Readout)'}
                      </Text>
                      {isSpeaking && currentSpeakingId === `ai-doc-${activeAiSample.id}` && (
                        <View style={S.audioWaveBarContainer}>
                          <View style={[S.audioWaveBar, Platform.OS === 'web' ? ({ className: 'audio-wave-anim-1' } as any) : {}]} />
                          <View style={[S.audioWaveBar, Platform.OS === 'web' ? ({ className: 'audio-wave-anim-2' } as any) : {}]} />
                          <View style={[S.audioWaveBar, Platform.OS === 'web' ? ({ className: 'audio-wave-anim-3' } as any) : {}]} />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[S.aiDoctorScanOwnBtn, isDay ? S.aiDoctorScanOwnBtnDay : S.aiDoctorScanOwnBtnNight]}
                      onPress={() => router.push('/topic/Crop-Doctors')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="camera-outline" size={16} color={isDay ? '#0284c7' : '#38bdf8'} />
                      <Text style={[S.aiDoctorScanOwnBtnText, isDay ? S.aiDoctorScanOwnBtnTextDay : S.aiDoctorScanOwnBtnTextNight]}>
                        Scan Your Own Field Crop
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </SpatialTiltCard>
        </View>

        {/* ══ WHY INDIAN CULTIVATORS CHOOSE FARMSKING (INTELLIGENT FEATURES GRID) ══ */}
        <View style={S.featuresSection}>
          <View style={S.sectionHeader}>
            <View style={[S.sectionBadgeRow, isDay && S.sectionBadgeRowDay]}>
              <View style={[S.sectionBadgeDot, isDay && S.sectionBadgeDotDay]} />
              <Text style={[S.sectionEyebrow, isDay && S.sectionEyebrowDay]}>ADVANCED AGRI CAPABILITIES</Text>
            </View>
            <Text style={[S.sectionHeadline, isDay && S.sectionHeadlineDay]}>Engineered for Peak Farm Yield</Text>
            <Text style={[S.sectionSubhead, isDay && S.sectionSubheadDay]}>
              From orbital satellite indices to laboratory-certified agronomy, FarmsKing combines high-precision technology with practical farm operations.
            </Text>
          </View>

          <View style={S.featuresGrid}>
            {/* Feature 1 */}
            <SpatialTiltCard
              style={[
                S.featureCard,
                isTablet && S.featureCardTablet,
                isMobile && S.featureCardMobile,
                isDay && S.featureCardDay,
              ]}
              glowColor={isDay ? 'rgba(16, 185, 129, 0.2)' : 'rgba(167, 243, 208, 0.35)'}
              tiltMax={5}
              onPress={() => router.push('/crop-intelligence')}
            >
              <View style={[S.featureIconBox, { backgroundColor: isDay ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.22)' }]}>
                <Ionicons name="planet-outline" size={24} color={isDay ? '#059669' : '#a7f3d0'} />
              </View>
              <View style={S.featureBadgeRow}>
                <Text style={[S.featureBadgeText, { color: isDay ? '#059669' : '#a7f3d0' }]}>10M MULTI-SPECTRAL</Text>
              </View>
              <Text style={[S.featureTitle, isDay && S.featureTitleDay]}>Satellite Crop Telemetry</Text>
              <Text style={[S.featureDesc, isDay && S.featureDescDay]}>
                Track NDVI canopy vegetation, nitrogen levels, and moisture stress zone-by-zone without manual field probes.
              </Text>
            </SpatialTiltCard>

            {/* Feature 2 */}
            <SpatialTiltCard
              style={[
                S.featureCard,
                isTablet && S.featureCardTablet,
                isMobile && S.featureCardMobile,
                isDay && S.featureCardDay,
              ]}
              glowColor={isDay ? 'rgba(2, 132, 199, 0.2)' : 'rgba(186, 230, 253, 0.35)'}
              tiltMax={5}
              onPress={() => router.push('/topic/Crop-Doctors')}
            >
              <View style={[S.featureIconBox, { backgroundColor: isDay ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.22)' }]}>
                <Ionicons name="sparkles-outline" size={24} color={isDay ? '#0284c7' : '#bae6fd'} />
              </View>
              <View style={S.featureBadgeRow}>
                <Text style={[S.featureBadgeText, { color: isDay ? '#0284c7' : '#bae6fd' }]}>98.4% DIAGNOSIS ACCURACY</Text>
              </View>
              <Text style={[S.featureTitle, isDay && S.featureTitleDay]}>3-Second AI Plant Doctor</Text>
              <Text style={[S.featureDesc, isDay && S.featureDescDay]}>
                Instantly diagnose rust, blights, and pest infestations from a single smartphone camera photo with exact tank dosages.
              </Text>
            </SpatialTiltCard>

            {/* Feature 3 */}
            <SpatialTiltCard
              style={[
                S.featureCard,
                isTablet && S.featureCardTablet,
                isMobile && S.featureCardMobile,
                isDay && S.featureCardDay,
              ]}
              glowColor={isDay ? 'rgba(217, 119, 6, 0.2)' : 'rgba(253, 230, 138, 0.35)'}
              tiltMax={5}
              onPress={() => router.push('/topic/Farming')}
            >
              <View style={[S.featureIconBox, { backgroundColor: isDay ? 'rgba(217, 119, 6, 0.12)' : 'rgba(217, 119, 6, 0.22)' }]}>
                <Ionicons name="trending-up-outline" size={24} color={isDay ? '#d97706' : '#fde68a'} />
              </View>
              <View style={S.featureBadgeRow}>
                <Text style={[S.featureBadgeText, { color: isDay ? '#d97706' : '#fde68a' }]}>250+ LIVE APMC MANDIS</Text>
              </View>
              <Text style={[S.featureTitle, isDay && S.featureTitleDay]}>Direct APMC Bidding Radar</Text>
              <Text style={[S.featureDesc, isDay && S.featureDescDay]}>
                Compare daily auction bids across North India. Sell direct to certified institutional grain buyers with zero middleman cuts.
              </Text>
            </SpatialTiltCard>

            {/* Feature 4 */}
            <SpatialTiltCard
              style={[
                S.featureCard,
                isTablet && S.featureCardTablet,
                isMobile && S.featureCardMobile,
                isDay && S.featureCardDay,
              ]}
              glowColor={isDay ? 'rgba(219, 39, 119, 0.2)' : 'rgba(251, 207, 232, 0.35)'}
              tiltMax={5}
              onPress={() => router.push('/shop')}
            >
              <View style={[S.featureIconBox, { backgroundColor: isDay ? 'rgba(219, 39, 119, 0.12)' : 'rgba(219, 39, 119, 0.22)' }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={isDay ? '#db2777' : '#fbcfe8'} />
              </View>
              <View style={S.featureBadgeRow}>
                <Text style={[S.featureBadgeText, { color: isDay ? '#db2777' : '#fbcfe8' }]}>100% GENUINE CERTIFIED</Text>
              </View>
              <Text style={[S.featureTitle, isDay && S.featureTitleDay]}>Guaranteed Input Delivery</Text>
              <Text style={[S.featureDesc, isDay && S.featureDescDay]}>
                Certified seeds, bio-fungicides, micronutrients, and drip equipment dispatched directly to your village pin code.
              </Text>
            </SpatialTiltCard>
          </View>
        </View>

        {/* ══ VERIFIED CULTIVATOR FIELD SUCCESS STORIES ══ */}
        <View style={S.testimonialsSection}>
          <View style={S.sectionHeader}>
            <View style={[S.sectionBadgeRow, isDay && S.sectionBadgeRowDay]}>
              <View style={[S.sectionBadgeDot, isDay && S.sectionBadgeDotDay]} />
              <Text style={[S.sectionEyebrow, isDay && S.sectionEyebrowDay]}>FIELD VALIDATED RESULTS</Text>
            </View>
            <Text style={[S.sectionHeadline, isDay && S.sectionHeadlineDay]}>Trusted Across 50,000+ Acres</Text>
            <Text style={[S.sectionSubhead, isDay && S.sectionSubheadDay]}>
              Real experiences from progressive cultivators who rely on FarmsKing daily for crop decisions and market trade.
            </Text>
          </View>

          <View style={S.testimonialsGrid}>
            {/* Story 1 */}
            <View style={[S.testimonialCard, isTablet && S.testimonialCardTablet, isMobile && S.testimonialCardMobile, isDay && S.testimonialCardDay]}>
              <View style={S.testiStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={14} color="#f59e0b" />
                ))}
                <View style={S.testiMetricBadge}>
                  <Text style={S.testiMetricText}>+24% Yield Gain</Text>
                </View>
              </View>
              <Text style={[S.testiQuote, isDay && S.testiQuoteDay]}>
                "The satellite moisture maps helped us calibrate canal water cycles with precision. Our Basmati 1121 yield crossed 24 quintals per acre with zero lodging."
              </Text>
              <View style={S.testiAuthorRow}>
                <View style={S.testiAvatarCircle}>
                  <Text style={S.testiAvatarText}>GS</Text>
                </View>
                <View>
                  <Text style={[S.testiAuthorName, isDay && S.testiAuthorNameDay]}>S. Gurpreet Singh</Text>
                  <Text style={S.testiAuthorLocation}>Ludhiana • 38-Acre Progressive Cultivator</Text>
                </View>
              </View>
            </View>

            {/* Story 2 */}
            <View style={[S.testimonialCard, isTablet && S.testimonialCardTablet, isMobile && S.testimonialCardMobile, isDay && S.testimonialCardDay]}>
              <View style={S.testiStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={14} color="#f59e0b" />
                ))}
                <View style={S.testiMetricBadge}>
                  <Text style={S.testiMetricText}>Zero Disease Spread</Text>
                </View>
              </View>
              <Text style={[S.testiQuote, isDay && S.testiQuoteDay]}>
                "We detected Yellow Rust at the earliest pinhead stage using the Crop Doctor scanner. The exact spray dosage saved our 14-acre wheat crop from devastation."
              </Text>
              <View style={S.testiAuthorRow}>
                <View style={[S.testiAvatarCircle, { backgroundColor: '#0284c7' }]}>
                  <Text style={S.testiAvatarText}>BS</Text>
                </View>
                <View>
                  <Text style={[S.testiAuthorName, isDay && S.testiAuthorNameDay]}>Balwinder Singh</Text>
                  <Text style={S.testiAuthorLocation}>Khanna Mandi Region • Wheat & Mustard</Text>
                </View>
              </View>
            </View>

            {/* Story 3 */}
            <View style={[S.testimonialCard, isTablet && S.testimonialCardTablet, isMobile && S.testimonialCardMobile, isDay && S.testimonialCardDay]}>
              <View style={S.testiStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={14} color="#f59e0b" />
                ))}
                <View style={S.testiMetricBadge}>
                  <Text style={S.testiMetricText}>+₹140/q Higher Price</Text>
                </View>
              </View>
              <Text style={[S.testiQuote, isDay && S.testiQuoteDay]}>
                "Instant mandi pricing allowed us to route our paddy directly to Khanna instead of local village arhtiyas, securing ₹140 more per quintal transparently."
              </Text>
              <View style={S.testiAuthorRow}>
                <View style={[S.testiAvatarCircle, { backgroundColor: '#d97706' }]}>
                  <Text style={S.testiAvatarText}>HS</Text>
                </View>
                <View>
                  <Text style={[S.testiAuthorName, isDay && S.testiAuthorNameDay]}>Harjinder Singh</Text>
                  <Text style={S.testiAuthorLocation}>Sangrur • Organic Rice & Potato Grower</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ══ UNIVERSAL ACCESS & APP CALLOUT BANNER ══ */}
        <View style={S.appBannerWrapper}>
          <LinearGradient
            colors={isDay ? ['#e0f2fe', '#dcfce7'] : ['#0b1a30', '#062024']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              S.appBannerCard,
              isDay && S.appBannerCardDay,
              isMobile && { flexDirection: 'column', alignItems: 'stretch', padding: 20 },
            ]}
          >
            <View style={[S.appBannerLeft, isDesktop ? { flex: 7 } : { width: '100%' }]}>
              <View style={[S.bannerTag, isDay && S.bannerTagDay]}>
                <Ionicons name="sparkles" size={13} color={isDay ? '#047857' : '#a7f3d0'} />
                <Text style={[S.bannerTagText, isDay && { color: '#047857' }]}>MOBILE & WEB COMPATIBLE</Text>
              </View>
              <Text style={[S.bannerHeadline, isDay && S.bannerHeadlineDay]}>
                {t.appDownloadTitle}
              </Text>
              <Text style={[S.bannerSubhead, isDay && S.bannerSubheadDay]}>
                {t.appDownloadSub}
              </Text>

              <View style={S.bannerCtasRow}>
                <TouchableOpacity
                  style={S.bannerBtnPrimary}
                  onPress={() => router.push('/(auth)/login')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="rocket-outline" size={17} color="#022c22" />
                  <Text style={S.bannerBtnPrimaryText}>{t.getStarted}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[S.bannerBtnSecondary, isDay && S.bannerBtnSecondaryDay]}
                  onPress={() => router.push('/contact-us')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call-outline" size={16} color={isDay ? '#0f172a' : '#ffffff'} />
                  <Text style={[S.bannerBtnSecondaryText, isDay && { color: '#0f172a' }]}>
                    {t.farmerHelpline}: {supportContact.helplinePhone}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[S.bannerRight, isMobile && { marginTop: 18, width: '100%', alignItems: 'stretch' }]}>
              {!isMobile ? (
                <View style={[S.qrPreviewBox, isDay && S.qrPreviewBoxDay]}>
                  <FarmsKingQRCode size={130} />
                  <Text style={[S.qrScanText, isDay && { color: '#334155' }]}>{t.scanWithPhone}</Text>
                  <Text style={S.qrSubText}>www.farmsking.in</Text>
                </View>
              ) : (
                <View style={[S.mobileAppInstallCard, isDay ? S.mobileAppInstallCardDay : S.mobileAppInstallCardNight]}>
                  {/* Big Glowing 1-Click App Install Button */}
                  <TouchableOpacity
                    style={S.mobileInstallBigBtn}
                    onPress={() => {
                      if (typeof window !== 'undefined') {
                        const deferredPrompt = (window as any).deferredPrompt;
                        if (deferredPrompt) {
                          deferredPrompt.prompt();
                        } else {
                          window.open('/api/v1/app/download-apk', '_blank');
                        }
                      } else {
                        router.push('/(auth)/login');
                      }
                    }}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669', '#047857']}
                      style={S.mobileInstallGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={S.mobileInstallIconBadge}>
                        <Ionicons name="phone-portrait" size={24} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.mobileInstallTitle}>📲 Install FarmsKing App</Text>
                        <Text style={S.mobileInstallSub}>1-Click Fast APK / Universal Web App</Text>
                        <Text style={S.mobileInstallPerks}>Zero lag • Offline Mandi • Free Crop Doctor</Text>
                      </View>
                      <Ionicons name="download-outline" size={22} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Direct Web Instant Access option */}
                  <TouchableOpacity
                    style={[S.mobileDirectWebBtn, isDay ? S.mobileDirectWebBtnDay : S.mobileDirectWebBtnNight]}
                    onPress={() => router.push('/(auth)/login')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="globe-outline" size={15} color={isDay ? '#0284c7' : '#38bdf8'} />
                    <Text style={[S.mobileDirectWebText, isDay ? S.mobileDirectWebTextDay : S.mobileDirectWebTextNight]}>
                      Or Continue Directly in Browser (No Download Required) →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* ══ COMPREHENSIVE MULTI-COLUMN RESPONSIVE FOOTER ══ */}
        <View style={[S.footer, isDay && S.footerDay]}>
          <View style={S.footerColumnsGrid}>
            {/* Column 1: Brand & Mission */}
            <View style={[S.footerCol, isTablet && S.footerColTablet, isMobile && S.footerColMobile]}>
              <View style={S.footerBrandRow}>
                <Image
                  source={require('@/assets/images/farmsking_logo_transparent_bg.png')}
                  style={S.footerLogoImg}
                  resizeMode="contain"
                />
                <Text style={[S.footerBrandName, isDay && S.footerBrandNameDay]}>FarmsKing</Text>
              </View>
              <Text style={[S.footerDesc, isDay && S.footerDescDay]}>
                India's integrated agricultural intelligence platform uniting precision farming, urban gardening, AI plant pathology, and direct APMC mandi trade.
              </Text>
              <View style={[S.apmcBadgeRow, isDay && S.apmcBadgeRowDay]}>
                <Ionicons name="shield-checkmark" size={13} color="#10b981" />
                <Text style={[S.apmcBadgeText, isDay && { color: '#047857' }]}>APMC Live Market Verified Feed</Text>
              </View>
            </View>

            {/* Column 2: Solutions */}
            <View style={[S.footerCol, isTablet && S.footerColTablet, isMobile && S.footerColMobile]}>
              <Text style={[S.footerColTitle, isDay && S.footerColTitleDay]}>Ecosystem</Text>
              <TouchableOpacity onPress={() => router.push('/topic/Farming')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Precision Farming OS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/topic/Gardening')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Urban Gardening Kits</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/topic/Crop-Doctors')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>AI Crop Doctor Diagnosis</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/shop')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Certified Agri Store</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/crop-intelligence')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Satellite Telemetry</Text>
              </TouchableOpacity>
            </View>

            {/* Column 3: Platform & Company */}
            {/* Column 3: Legal & Regulatory */}
            <View style={[S.footerCol, isTablet && S.footerColTablet, isMobile && S.footerColMobile]}>
              <Text style={[S.footerColTitle, isDay && S.footerColTitleDay]}>Legal & Compliance</Text>
              <TouchableOpacity onPress={() => router.push('/compliance' as any)}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay, { color: isDay ? '#059669' : '#34d399', fontFamily: FONT.bold }]}>
                  MCA & Statutory Disclosures
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Privacy Policy (DPDPA 2023)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/terms' as any)}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/refund-policy' as any)}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Refund & Return Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/contact-us')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Grievance & Support Desk</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(partner)/(tabs)')}>
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Agronomist & Seller Portal</Text>
              </TouchableOpacity>
            </View>

            {/* Column 4: 24/7 Helpline */}
            <View style={[S.footerCol, isTablet && S.footerColTablet, isMobile && S.footerColMobile]}>
              <Text style={[S.footerColTitle, isDay && S.footerColTitleDay]}>{t.farmerHelpline}</Text>
              <Text style={[S.helplineNum, isDay && S.helplineNumDay]}>{supportContact.helplinePhone}</Text>
              <Text style={[S.helplineSub, isDay && S.helplineSubDay]}>{t.helplineHours}</Text>
              <Text style={[S.footerContactEmail, isDay && S.footerContactEmailDay]}>{supportContact.supportEmail}</Text>
              <Text style={[S.footerContactAddr, isDay && S.footerContactAddrDay]}>Ludhiana & Chandigarh, Punjab, India</Text>
            </View>
          </View>

          {/* Footer Bottom Bar */}
          <View style={[S.footerBottomRow, isDay && S.footerBottomRowDay]}>
            <Text style={[S.footerCopyText, isDay && S.footerCopyTextDay]}>
              © 2026 FarmsKing India Private Limited. All rights reserved.
            </Text>
            <View style={S.securityBadgesRow}>
              <Text style={[S.securityBadgeItem, isDay && { color: '#64748b' }]}>🔒 256-Bit SSL</Text>
              <Text style={[S.securityBadgeItem, isDay && { color: '#64748b' }]}>🌱 ICAR Compliant</Text>
              <Text style={[S.securityBadgeItem, isDay && { color: '#64748b' }]}>🇮🇳 Made for Indian Cultivators</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ══ MOBILE DOCKED BOTTOM APP BAR ══ */}
      {isMobile && (
        <View
          // @ts-ignore
          className="mobile-docked-bottom-bar"
          style={[S.mobileBottomBar, isDay && S.mobileBottomBarDay]}
        >
          {/* Tab 1: Home */}
          <TouchableOpacity
            style={S.bottomTabItem}
            onPress={() => router.push('/')}
            activeOpacity={0.75}
          >
            <Ionicons name="home" size={20} color={isDay ? '#047857' : '#34d399'} />
            <Text style={[S.bottomTabText, S.bottomTabTextActive, isDay && S.bottomTabTextActiveDay]}>Home</Text>
            <View style={[S.bottomTabActiveDot, isDay && S.bottomTabActiveDotDay]} />
          </TouchableOpacity>

          {/* Tab 2: Mandi */}
          <TouchableOpacity
            style={S.bottomTabItem}
            onPress={() => router.push('/shop')}
            activeOpacity={0.75}
          >
            <View style={S.tabIconWrapper}>
              <Ionicons name="trending-up" size={20} color={isDay ? '#475569' : '#94a3b8'} />
              <View style={S.mandiLiveBeaconDot} />
            </View>
            <Text style={[S.bottomTabText, isDay && S.bottomTabTextDay]}>Mandi</Text>
          </TouchableOpacity>

          {/* Tab 3: Center Elevated Action - AI Plant Doctor */}
          <TouchableOpacity
            style={S.bottomCenterActionTab}
            onPress={() => router.push('/topic/Crop-Doctors')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDay ? ['#10b981', '#059669'] : ['#34d399', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={S.bottomCenterActionCircle}
            >
              <Ionicons name="sparkles" size={22} color="#ffffff" />
            </LinearGradient>
            <Text style={[S.bottomCenterActionText, isDay && S.bottomCenterActionTextDay]}>AI Doctor</Text>
          </TouchableOpacity>

          {/* Tab 4: Agri Store */}
          <TouchableOpacity
            style={S.bottomTabItem}
            onPress={() => router.push('/shop')}
            activeOpacity={0.75}
          >
            <Ionicons name="bag-handle-outline" size={20} color={isDay ? '#475569' : '#94a3b8'} />
            <Text style={[S.bottomTabText, isDay && S.bottomTabTextDay]}>Store</Text>
          </TouchableOpacity>

          {/* Tab 5: App Menu */}
          <TouchableOpacity
            style={S.bottomTabItem}
            onPress={() => setMobileMenuOpen(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="grid-outline" size={20} color={isDay ? '#475569' : '#94a3b8'} />
            <Text style={[S.bottomTabText, isDay && S.bottomTabTextDay]}>Menu</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══ APP-STYLE MOBILE NAVIGATION SHEET / DRAWER ══ */}
      <Modal
        visible={mobileMenuOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setMobileMenuOpen(false)}
      >
        <View style={S.modalOverlayBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setMobileMenuOpen(false)}
          />

          <View style={[S.appDrawerContainer, isDay && S.appDrawerContainerDay]}>
            {/* Top Sheet Drag Handle */}
            <View style={[S.sheetHandleBar, isDay && S.sheetHandleBarDay]} />

            {/* Header: Brand & Close Button */}
            <View style={S.drawerHeaderRow}>
              <View style={S.drawerBrandRow}>
                <Image
                  source={require('@/assets/images/farmsking_logo_transparent_bg.png')}
                  style={S.drawerLogoImg}
                  resizeMode="contain"
                />
                <View>
                  <Text style={[S.drawerBrandText, isDay && S.drawerBrandTextDay]}>FarmsKing</Text>
                  <Text style={[S.drawerSubBrandText, isDay && S.drawerSubBrandTextDay]}>Smart Farming Platform OS</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[S.drawerCloseBtn, isDay && S.drawerCloseBtnDay]}
                onPress={() => setMobileMenuOpen(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color={isDay ? '#0f172a' : '#ffffff'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.drawerScrollContent}>
              {/* Cultivator Status / Account Card */}
              <View style={[S.drawerUserBanner, isDay && S.drawerUserBannerDay]}>
                <View style={[S.drawerUserIconBox, isDay && S.drawerUserIconBoxDay]}>
                  <Ionicons name="person" size={18} color={isDay ? '#047857' : '#34d399'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.drawerUserTitle, isDay && S.drawerUserTitleDay]}>
                    {user ? `Welcome, ${user.name || 'Cultivator'}` : 'Cultivator Guest Portal'}
                  </Text>
                  <Text style={[S.drawerUserSub, isDay && S.drawerUserSubDay]}>
                    {user ? 'Verified agricultural account' : 'Login for personalized crop advisories'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[S.drawerUserActionBtn, isDay && S.drawerUserActionBtnDay]}
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push(user ? '/(user)/(tabs)' : '/(auth)/login');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[S.drawerUserActionText, isDay && S.drawerUserActionTextDay]}>
                    {user ? 'Dashboard' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Platform Modules (2x3 Grid of App Feature Cards) */}
              <Text style={[S.drawerSectionLabel, isDay && S.drawerSectionLabelDay]}>PLATFORM MODULES</Text>
              <View style={S.appModulesGrid}>
                {/* 1: Farming */}
                <TouchableOpacity
                  // @ts-ignore
                  className="app-module-tile"
                  style={[S.appModuleTile, isDay && S.appModuleTileDay]}
                  onPress={() => { setMobileMenuOpen(false); router.push('/topic/Farming'); }}
                  activeOpacity={0.8}
                >
                  <View style={[S.appModuleIconBox, { backgroundColor: isDay ? '#fef3c7' : 'rgba(245, 158, 11, 0.18)' }]}>
                    <Ionicons name="leaf" size={20} color="#f59e0b" />
                  </View>
                  <Text style={[S.appModuleTitle, isDay && S.appModuleTitleDay]}>Farming OS</Text>
                  <Text style={[S.appModuleDesc, isDay && S.appModuleDescDay]}>Precision Agri</Text>
                </TouchableOpacity>

                {/* 2: Gardening */}
                <TouchableOpacity
                  // @ts-ignore
                  className="app-module-tile"
                  style={[S.appModuleTile, isDay && S.appModuleTileDay]}
                  onPress={() => { setMobileMenuOpen(false); router.push('/topic/Gardening'); }}
                  activeOpacity={0.8}
                >
                  <View style={[S.appModuleIconBox, { backgroundColor: isDay ? '#fce7f3' : 'rgba(236, 72, 153, 0.18)' }]}>
                    <Ionicons name="flower" size={20} color="#ec4899" />
                  </View>
                  <Text style={[S.appModuleTitle, isDay && S.appModuleTitleDay]}>Gardening</Text>
                  <Text style={[S.appModuleDesc, isDay && S.appModuleDescDay]}>Home Grow Kits</Text>
                </TouchableOpacity>

                {/* 3: Crop Doctor */}
                <TouchableOpacity
                  // @ts-ignore
                  className="app-module-tile"
                  style={[S.appModuleTile, isDay && S.appModuleTileDay]}
                  onPress={() => { setMobileMenuOpen(false); router.push('/topic/Crop-Doctors'); }}
                  activeOpacity={0.8}
                >
                  <View style={[S.appModuleIconBox, { backgroundColor: isDay ? '#d1fae5' : 'rgba(16, 185, 129, 0.18)' }]}>
                    <Ionicons name="sparkles" size={20} color="#10b981" />
                  </View>
                  <Text style={[S.appModuleTitle, isDay && S.appModuleTitleDay]}>AI Crop Doctor</Text>
                  <Text style={[S.appModuleDesc, isDay && S.appModuleDescDay]}>3-Sec Diagnosis</Text>
                </TouchableOpacity>

                {/* 4: Agri Store */}
                <TouchableOpacity
                  // @ts-ignore
                  className="app-module-tile"
                  style={[S.appModuleTile, isDay && S.appModuleTileDay]}
                  onPress={() => { setMobileMenuOpen(false); router.push('/shop'); }}
                  activeOpacity={0.8}
                >
                  <View style={[S.appModuleIconBox, { backgroundColor: isDay ? '#e0f2fe' : 'rgba(14, 165, 233, 0.18)' }]}>
                    <Ionicons name="cart" size={20} color="#0ea5e9" />
                  </View>
                  <Text style={[S.appModuleTitle, isDay && S.appModuleTitleDay]}>Agri Store</Text>
                  <Text style={[S.appModuleDesc, isDay && S.appModuleDescDay]}>Seeds & Inputs</Text>
                </TouchableOpacity>

                {/* 5: Mandi Radar */}
                <TouchableOpacity
                  // @ts-ignore
                  className="app-module-tile"
                  style={[S.appModuleTile, isDay && S.appModuleTileDay]}
                  onPress={() => { setMobileMenuOpen(false); router.push('/shop'); }}
                  activeOpacity={0.8}
                >
                  <View style={[S.appModuleIconBox, { backgroundColor: isDay ? '#fef08a' : 'rgba(234, 179, 8, 0.18)' }]}>
                    <Ionicons name="trending-up" size={20} color="#eab308" />
                  </View>
                  <Text style={[S.appModuleTitle, isDay && S.appModuleTitleDay]}>Mandi Radar</Text>
                  <Text style={[S.appModuleDesc, isDay && S.appModuleDescDay]}>250+ Live APMCs</Text>
                </TouchableOpacity>

                {/* 6: Knowledge & Support */}
                <TouchableOpacity
                  // @ts-ignore
                  className="app-module-tile"
                  style={[S.appModuleTile, isDay && S.appModuleTileDay]}
                  onPress={() => { setMobileMenuOpen(false); router.push('/support'); }}
                  activeOpacity={0.8}
                >
                  <View style={[S.appModuleIconBox, { backgroundColor: isDay ? '#e2e8f0' : 'rgba(148, 163, 184, 0.18)' }]}>
                    <Ionicons name="help-buoy" size={20} color="#64748b" />
                  </View>
                  <Text style={[S.appModuleTitle, isDay && S.appModuleTitleDay]}>Knowledge Base</Text>
                  <Text style={[S.appModuleDesc, isDay && S.appModuleDescDay]}>Farmer Guides</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Settings: Theme & Language */}
              <View style={[S.drawerPreferencesCard, isDay && S.drawerPreferencesCardDay]}>
                <View style={S.drawerPrefRow}>
                  <Text style={[S.drawerPrefLabel, isDay && S.drawerPrefLabelDay]}>Theme Mode:</Text>
                  <View style={[S.themeToggleBox, isDay ? S.themeToggleBoxDay : S.themeToggleBoxNight]}>
                    <TouchableOpacity
                      style={[S.themeSegment, isDay && S.themeSegmentActiveDay]}
                      onPress={() => toggleTheme('day')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="sunny" size={12} color={isDay ? '#b45309' : '#94a3b8'} />
                      <Text style={[S.themeSegmentText, isDay && S.themeSegmentTextActiveDay]}>Day</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[S.themeSegment, !isDay && S.themeSegmentActiveNight]}
                      onPress={() => toggleTheme('night')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="moon" size={11.5} color={!isDay ? '#38bdf8' : '#94a3b8'} />
                      <Text style={[S.themeSegmentText, !isDay && S.themeSegmentTextActiveNight]}>Night</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[S.drawerPrefDivider, isDay && S.drawerPrefDividerDay]} />

                <View style={S.drawerPrefRow}>
                  <Text style={[S.drawerPrefLabel, isDay && S.drawerPrefLabelDay]}>Language:</Text>
                  <View style={S.drawerLangChipsRow}>
                    {(['EN', 'PA', 'HI'] as const).map((l) => (
                      <TouchableOpacity
                        key={l}
                        style={[
                          S.mobileLangChip,
                          isDay && S.mobileLangChipDay,
                          lang === l && (isDay ? S.mobileLangChipActiveDay : S.mobileLangChipActiveNight),
                        ]}
                        onPress={() => setLang(l)}
                      >
                        <Text
                          style={[
                            S.mobileLangChipText,
                            isDay && { color: '#475569' },
                            lang === l && { color: isDay ? '#047857' : '#a7f3d0', fontFamily: FONT.bold },
                          ]}
                        >
                          {l === 'EN' ? 'English' : l === 'PA' ? 'ਪੰਜਾਬੀ' : 'हिंदी'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Direct Helpline Strip */}
              <TouchableOpacity
                style={[S.drawerHelplineStrip, isDay && S.drawerHelplineStripDay]}
                onPress={() => router.push('/contact-us')}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={16} color={isDay ? '#047857' : '#34d399'} />
                <Text style={[S.drawerHelplineText, isDay && S.drawerHelplineTextDay]}>
                  {t.farmerHelpline}: {supportContact.helplinePhone}
                </Text>
              </TouchableOpacity>

              {/* Bottom Big Action Button */}
              <TouchableOpacity
                style={[S.drawerMainActionBtn, isDay && S.drawerMainActionBtnDay]}
                onPress={() => {
                  setMobileMenuOpen(false);
                  router.push(user ? '/(user)/(tabs)' : '/(auth)/login');
                }}
                activeOpacity={0.88}
              >
                <Ionicons name="rocket-outline" size={18} color="#022c22" />
                <Text style={S.drawerMainActionBtnText}>
                  {user ? 'Open Farmer Dashboard' : 'Login / Enter FarmsKing App'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══ LIVE SOCIAL PROOF ACTIVITY TICKER (FLOATING BOTTOM-LEFT) ══ */}
      {!tickerDismissed && (
        <Animated.View
          style={[
            S.liveTickerFixedContainer,
            isMobile && S.liveTickerFixedContainerMobile,
            tickerAnimatedStyle,
          ]}
        >
          <View
            style={[
              S.liveTickerCard,
              isDay ? S.liveTickerCardDay : S.liveTickerCardNight,
              Platform.OS === 'web' ? ({ className: isDay ? 'live-ticker-shadow-day' : 'live-ticker-shadow-night' } as any) : {},
            ]}
          >
            {/* Live Indicator Beacon Dot + Emoji Circle */}
            <View style={S.liveTickerLeftCol}>
              <View style={[S.liveTickerEmojiCircle, { borderColor: currentActivity.tagColor }]}>
                <Text style={{ fontSize: 16 }}>{currentActivity.emoji}</Text>
                <View style={S.liveTickerPulseDot} />
              </View>
            </View>

            {/* Content */}
            <View style={S.liveTickerBody}>
              <View style={S.liveTickerHeaderRow}>
                <Text
                  style={[S.liveTickerFarmerName, isDay ? S.liveTickerFarmerNameDay : S.liveTickerFarmerNameNight]}
                  numberOfLines={1}
                >
                  {currentActivity.name}
                </Text>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text
                  style={[S.liveTickerLocationText, isDay ? S.liveTickerLocationTextDay : S.liveTickerLocationTextNight]}
                >
                  ({currentActivity.location})
                </Text>
              </View>

              <Text
                style={[S.liveTickerActionText, isDay ? S.liveTickerActionTextDay : S.liveTickerActionTextNight]}
                numberOfLines={1}
              >
                {currentActivity.action}
              </Text>

              <View style={S.liveTickerMetaRow}>
                <Text style={S.liveTickerDetailText}>{currentActivity.detail}</Text>
                <Text style={S.liveTickerBullet}>•</Text>
                <Text style={S.liveTickerTimeText}>{currentActivity.timeAgo}</Text>
              </View>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity
              onPress={() => setTickerDismissed(true)}
              style={S.liveTickerCloseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={13} color={isDay ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ══ FLOATING QUICK WHATSAPP SUPPORT PILL (BOTTOM-RIGHT) ══ */}
      <TouchableOpacity
        style={[
          S.floatingWhatsAppBtn,
          isMobile && S.floatingWhatsAppBtnMobile,
          Platform.OS === 'web' ? ({ className: 'floating-whatsapp-pulse' } as any) : {},
        ]}
        onPress={() => {
          const msg = encodeURIComponent(
            'Hello FarmsKing Expert Agronomist, I need agricultural guidance for my crops and farm management.'
          );
          const url = `https://wa.me/9195776220000?text=${msg}`;
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.open(url, '_blank');
          } else {
            Linking.openURL(url);
          }
        }}
        activeOpacity={0.88}
        accessibilityLabel="Chat with FarmsKing Expert on WhatsApp"
      >
        <LinearGradient
          colors={['#25D366', '#128C7E']}
          style={S.floatingWhatsAppGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Live pulsing beacon */}
          <View style={S.whatsAppBeaconWrap}>
            <View style={S.whatsAppBeaconDot} />
          </View>

          <Ionicons name="logo-whatsapp" size={isMobile ? 18 : 22} color="#ffffff" />

          {!isMobile ? (
            <View style={S.whatsAppTextCol}>
              <Text style={S.whatsAppTopLabel}>EXPERT HELP</Text>
              <Text style={S.whatsAppMainText}>WhatsApp Farmer Desk</Text>
            </View>
          ) : (
            <Text style={S.whatsAppMobileText}>WhatsApp</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#040a17',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  scrollContainerDesktop: {
    paddingTop: 72,
    paddingBottom: 40,
  },
  scrollContainerMobile: {
    paddingTop: 104,
    paddingBottom: 110,
  },

  // Mandi Rate Scrolling Strip (Inside Instant Mandi Directory)
  mandiRateTickerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 14, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mandiRateLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  mandiRateLiveBadgeText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#34d399',
    letterSpacing: 0.6,
  },
  mandiRateViewport: {
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mandiRateTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mandiRateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.pill,
    marginRight: 4,
  },
  mandiRateCrop: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  mandiRateVariety: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  mandiRateHub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  mandiRatePrice: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  mandiRateChange: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  mandiRateChangeUp: {
    color: '#34d399',
  },
  mandiRateChangeDown: {
    color: '#f87171',
  },
  mandiRatePinnedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  mandiRatePinnedBtnText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#6ee7b7',
  },

  // Ticker Bar
  tickerBar: {
    backgroundColor: '#060e20',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    zIndex: 35,
  },
  tickerBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  tickerLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  tickerLiveText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.6,
  },
  tickerViewport: {
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.pill,
    marginRight: 4,
  },
  tickerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tickerVerifiedText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.2,
  },
  tickerCrop: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  tickerVariety: {
    fontSize: 10,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  tickerHub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  tickerPrice: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  tickerChange: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  tickerTime: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  tickerLoginCtaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginHorizontal: 6,
  },
  tickerLoginLockIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerLoginCtaTitle: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#e2e8f0',
  },
  tickerLoginCtaBtnBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tickerLoginCtaBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
  },
  tickerBarPinnedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  tickerBarPinnedBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#6ee7b7',
  },

  // Header
  headerWrapper: {
    paddingHorizontal: '4%',
    paddingTop: 12,
    paddingBottom: 6,
    maxWidth: 1320,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 11,
    ...premiumShadow('rgba(0,0,0,0.4)', 'lg'),
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoImg: {
    width: 38,
    height: 38,
  },
  brandLogoText: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  brandLogoSubTag: {
    fontSize: 8,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 1,
    marginTop: -2,
  },
  brandLogoSubTagDay: {
    color: '#10b981',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLinkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLink: {
    color: '#94a3b8',
    fontSize: 14,
    fontFamily: FONT.semiBold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navLinkDay: {
    color: '#64748b',
  },
  navLinkNight: {
    color: '#94a3b8',
  },
  navLinkActiveDay: {
    color: '#10b981',
  },
  navLinkActiveNight: {
    color: '#60a5fa',
  },
  navLinkIndicatorBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 2,
    width: 28,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topLineControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    flexShrink: 0,
  },
  portalLoginBtn: {
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  portalLoginBtnDay: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  portalLoginBtnNight: {
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  portalLoginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  portalLoginTextBox: {
    flexDirection: 'column',
  },
  portalLoginTitle: {
    color: '#34d399',
    fontSize: 13,
    fontFamily: FONT.bold,
    lineHeight: 16,
  },
  portalLoginTitleDay: {
    color: '#059669',
  },
  portalLoginSubtitle: {
    color: '#a7f3d0',
    fontSize: 9,
    fontFamily: FONT.semiBold,
    letterSpacing: 0.3,
  },
  portalLoginSubtitleDay: {
    color: '#16a34a',
  },
  userDashboardBtn: {
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    ...premiumShadow('rgba(16,185,129,0.2)', 'sm'),
  },
  userDashboardBtnDay: {
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  userDashboardBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
    maxWidth: 175,
  },
  userAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarMiniText: {
    color: '#047857',
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  userDashboardTextBox: {
    flex: 1,
    justifyContent: 'center',
  },
  userDashboardName: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
    lineHeight: 14,
  },
  userDashboardCueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  userDashboardCueText: {
    color: '#a7f3d0',
    fontSize: 9.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.3,
  },
  langPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langOption: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  langOptionActive: {
    color: '#10b981',
    fontFamily: FONT.bold,
  },
  langDivider: {
    fontSize: 10,
    color: '#475569',
  },
  loginBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  loginBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Hero Section
  heroSection: {
    position: 'relative',
    paddingHorizontal: '5%',
    paddingTop: 8,
    paddingBottom: 20,
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
  },
  heroMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  glowOrbBabyMint: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(167, 243, 208, 0.12)',
    top: -90,
    left: -70,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)' } as any) : {}),
  },
  glowOrbBabyBlue: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(186, 230, 253, 0.1)',
    bottom: -40,
    right: -50,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)' } as any) : {}),
  },
  glowOrbBabyPink: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(251, 207, 232, 0.08)',
    top: 180,
    right: 80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(90px)' } as any) : {}),
  },
  glowOrbBabyPeach: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(253, 230, 138, 0.07)',
    bottom: 60,
    left: 80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(90px)' } as any) : {}),
  },
  heroLeft: {
    justifyContent: 'center',
    zIndex: 10,
  },
  osBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(167, 243, 208, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  osBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#a7f3d0',
  },
  osBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    letterSpacing: 0.8,
  },
  heroMainTitle: {
    fontSize: 44,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    lineHeight: 52,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubTitle: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 580,
  },

  // Compact 4D Mandi Discovery Card
  mandiDiscoveryCard: {
    width: '100%',
    backgroundColor: '#041d14',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    padding: 12,
    marginBottom: 14,
    ...(Platform.OS === 'web'
      ? ({
          background: 'linear-gradient(145deg, rgba(6, 44, 30, 0.96) 0%, rgba(2, 26, 18, 0.96) 60%, rgba(8, 18, 14, 0.98) 100%)',
          boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.75), 0 0 24px rgba(16, 185, 129, 0.22), inset 0 1px 1px rgba(52, 211, 153, 0.35)',
        } as any)
      : {
          ...premiumShadow('#000000', 'md'),
        }),
  },
  mandiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mandiHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mandiCardTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  liveBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  liveBadgeMiniText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#34d399',
    letterSpacing: 0.4,
  },
  mandiRate4DBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#052e16',
    borderWidth: 1.2,
    borderColor: '#34d399',
    ...(Platform.OS === 'web'
      ? ({
          background: 'linear-gradient(135deg, #052e16 0%, #064e3b 50%, #047857 100%)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
          cursor: 'pointer',
        } as any)
      : {
          elevation: 5,
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
        }),
  },
  mandiRate4DBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    letterSpacing: 0.2,
  },
  fourDBtnPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
    marginLeft: 2,
  },
  fourDBtnPillText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#6ee7b7',
  },

  // ─── Continuous Upward Mandi Ticker Window & Slot Styles ─────────────
  mandiRollerSlot: {
    height: 114,
    backgroundColor: 'rgba(3, 20, 14, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  mandiRollerSlotNight: {
    backgroundColor: 'rgba(3, 20, 14, 0.92)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  mandiRollerRowItem: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  rollerCropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.2,
    backgroundColor: 'rgba(6, 78, 59, 0.55)',
    borderColor: '#34d399',
  },
  rollerCropBadgeNight: {
    backgroundColor: 'rgba(6, 78, 59, 0.55)',
    borderColor: '#34d399',
  },
  rollerCropText: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.2,
  },
  rollerCropTextNight: {
    color: '#ffffff',
  },
  rollerCropPunjabiTag: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  rollerCropPunjabiTagNight: {
    color: '#6ee7b7',
  },
  rollerVarietyText: {
    fontSize: 10,
    fontFamily: FONT.medium,
  },
  rollerVarietyTextNight: {
    color: '#94a3b8',
  },
  rollerMandiInfo: {
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  rollerMandiName: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  rollerStateSub: {
    fontSize: 10,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  rollerPriceGroup: {
    alignItems: 'flex-end',
  },
  rollerPriceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  rollerPriceVal: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.3,
  },
  rollerPriceValNight: {
    color: '#34d399',
  },
  rollerPriceUnit: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  rollerTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 1,
  },
  rollerTrendText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  rollerTrendTextNight: {
    color: '#34d399',
  },
  rollerIndicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
    paddingHorizontal: 2,
  },
  rollerCounterText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  upwardMovingIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  upwardMovingIndicatorBadgeNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  upwardMovingIndicatorText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
  },
  upwardMovingIndicatorTextNight: {
    color: '#34d399',
  },

  // ─── Verified APMC Footer ──────────────────────────────────────────────
  mandiVerifiedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  mandiVerifiedText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  mandiVerifiedLink: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#34d399',
  },

  // 4D Official Rates Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any) : {}),
  },
  officialModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0a1912',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    padding: 20,
    ...premiumShadow('#00ff87', 'lg'),
  },
  officialModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  officialModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  officialModalIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  officialModalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 3,
  },
  officialModalSub: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 16,
  },
  officialModalCloseBtn: {
    padding: 4,
  },
  officialPerksList: {
    gap: 9,
    marginBottom: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  officialPerkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officialPerkText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#e2e8f0',
    flex: 1,
  },
  officialModalActions: {
    gap: 8,
  },
  officialModalPrimaryBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    ...premiumShadow('#10b981', 'md'),
  },
  officialModalPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  officialModalPrimaryText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  officialModalSecondaryBtn: {
    alignItems: 'center',
    paddingVertical: 7,
  },
  officialModalSecondaryText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },

  // CTA Row
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  primaryBtnContainer: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    ...premiumShadow('#a7f3d0', 'md'),
  },
  primaryBtnContainerWide: {
    borderRadius: 16,
    flex: 1,
    minWidth: 280,
  },
  primaryBtnContainerNight: {
    ...premiumShadow('#10b981', 'md'),
  },
  btnPrimaryWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  btnPrimarySparkleWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryTextBox: {
    flex: 1,
  },
  btnPrimaryTextWide: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.2,
  },
  btnPrimarySubWide: {
    color: '#d1fae5',
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  btnPrimaryArrowPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  btnPrimaryText: {
    color: '#022c22',
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(186, 230, 253, 0.35)',
    backgroundColor: 'rgba(186, 230, 253, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  btnSecondaryText: {
    color: '#bae6fd',
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },

  // Trust Stats Bar
  trustStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statNum: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
  },
  statLabel: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Right Column Showcase Frame
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  showcaseFrame: {
    width: '100%',
    maxWidth: 580,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 243, 208, 0.4)',
    backgroundColor: '#0a1428',
    position: 'relative',
    ...premiumShadow('#000000', 'lg'),
  },
  showcaseTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  showcaseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#a7f3d0',
    marginRight: 6,
  },
  showcaseTopText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    letterSpacing: 0.8,
    flex: 1,
  },
  showcaseGpsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  showcaseGpsText: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#bae6fd',
  },
  showcaseImageDesktop: {
    width: '100%',
    aspectRatio: 1376 / 543,
  },
  showcaseImageMobile: {
    width: '100%',
    aspectRatio: 1376 / 543,
  },
  overlayTelemetryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overlayPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#a7f3d0',
  },
  overlayBadgeTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  overlayBadgeSub: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#cbd5e1',
  },
  telemetrySignalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 243, 208, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  telemetrySignalText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
  },

  // 4 Pillars Section
  pillarsSection: {
    paddingVertical: 48,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a7f3d0',
  },
  sectionEyebrow: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    letterSpacing: 1.8,
  },
  sectionHeadline: {
    fontSize: 32,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubhead: {
    fontSize: 14,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 620,
    lineHeight: 22,
  },
  fourCardsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  // ══ Exact Original Picture 3D Glass Pillar Cards & Buttons ══
  pillarCardOrig: {
    flex: 1,
    minWidth: 230,
    maxWidth: 270,
    backgroundColor: 'rgba(20, 28, 42, 0.78)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
    ...premiumShadow('#000000', 'lg'),
  },
  cardFlareTop: {
    position: 'absolute',
    top: 0,
    left: '28%',
    right: '28%',
    height: 3.5,
    borderRadius: 2,
    zIndex: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardFlareBottom: {
    position: 'absolute',
    bottom: 0,
    left: '32%',
    right: '32%',
    height: 2.5,
    borderRadius: 1.5,
    opacity: 0.7,
    zIndex: 10,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  origCardArrowBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  cropDoctorsHeaderRow: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 15,
  },
  origCardArrowBadgeMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarThumbBox: {
    width: '100%',
    height: 184,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 2,
    position: 'relative',
    overflow: 'visible',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  pillarThumbBoxDay: {
    backgroundColor: 'transparent',
  },
  pillarThumbBoxNight: {
    backgroundColor: 'transparent',
  },
  thumbBoxFarmingDay: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  thumbBoxFarmingNight: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  thumbBoxGardeningDay: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  thumbBoxGardeningNight: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  thumbBoxCropDoctorsDay: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  thumbBoxCropDoctorsNight: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  thumbBoxAgriStoreDay: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  thumbBoxAgriStoreNight: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  pillarThumbImg: {
    width: '100%',
    maxWidth: 220,
    height: 172,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({ filter: 'drop-shadow(0 14px 22px rgba(0, 0, 0, 0.16))' } as any)
      : {}),
  },
  origCardTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  origCardSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 16.5,
    minHeight: 34,
    marginBottom: 16,
  },
  origPillBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  origPillBtnFarming: {
    backgroundColor: 'rgba(180, 110, 60, 0.28)',
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  origPillBtnGardening: {
    backgroundColor: 'rgba(150, 90, 120, 0.28)',
    borderColor: 'rgba(244, 114, 182, 0.5)',
  },
  origPillBtnCropDoctors: {
    backgroundColor: 'rgba(20, 100, 70, 0.32)',
    borderColor: 'rgba(52, 211, 153, 0.55)',
  },
  origPillBtnAgriStore: {
    backgroundColor: 'rgba(20, 90, 95, 0.32)',
    borderColor: 'rgba(45, 212, 191, 0.55)',
  },
  origPillBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerBrand: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginBottom: 4,
  },
  footerCopy: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#64748b',
    textAlign: 'center',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DAY THEME STYLES (Clean Sunlit Porcelain & Baby Light Pastels)
  // ══════════════════════════════════════════════════════════════════════════
  rootDay: {
    backgroundColor: '#f6faf7',
  },
  mandiRateTickerStripDay: {
    backgroundColor: '#f0fdf4',
    borderColor: '#a7f3d0',
  },
  mandiRateLiveBadgeDay: {
    backgroundColor: '#d1fae5',
  },
  mandiRateLiveBadgeTextDay: {
    color: '#047857',
  },
  mandiRateChipDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  mandiRateCropDay: {
    color: '#0f172a',
  },
  mandiRateVarietyDay: {
    color: '#64748b',
  },
  mandiRateHubDay: {
    color: '#475569',
  },
  mandiRatePriceDay: {
    color: '#059669',
  },
  mandiRatePinnedBtnDay: {
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  mandiRatePinnedBtnTextDay: {
    color: '#047857',
  },
  tickerBarDay: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  tickerLiveTagDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  tickerLiveTextDay: {
    color: '#059669',
  },
  tickerItemDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  tickerVerifiedBadgeDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  tickerVerifiedTextDay: {
    color: '#047857',
  },
  tickerCropDay: {
    color: '#0f172a',
  },
  tickerVarietyDay: {
    color: '#64748b',
  },
  tickerHubDay: {
    color: '#64748b',
  },
  tickerPriceDay: {
    color: '#0f172a',
  },
  tickerTimeDay: {
    color: '#94a3b8',
  },
  tickerLoginCtaChipDay: {
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  tickerLoginLockIconDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tickerLoginCtaTitleDay: {
    color: '#0f172a',
  },
  tickerLoginCtaBtnBadgeDay: {
    backgroundColor: '#d1fae5',
  },
  tickerLoginCtaBtnTextDay: {
    color: '#047857',
  },
  tickerBarPinnedBtnDay: {
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(5, 150, 105, 0.35)',
  },
  tickerBarPinnedBtnTextDay: {
    color: '#047857',
  },
  headerDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...premiumShadow('rgba(0,0,0,0.08)', 'lg'),
  },
  brandLogoTextDay: {
    color: '#0f172a',
  },
  navLinkDay: {
    color: '#64748b',
  },
  navLinkActiveDay: {
    color: '#3b82f6',
  },

  // Theme Toggle Switch
  themeToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    padding: 2,
    borderWidth: 1,
  },
  themeToggleBoxDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  themeToggleBoxNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  themeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
  },
  themeSegmentActiveDay: {
    backgroundColor: '#ffffff',
    ...premiumShadow('#0f172a', 'xs'),
  },
  themeSegmentActiveNight: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  themeSegmentText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  themeSegmentTextActiveDay: {
    color: '#b45309',
    fontFamily: FONT.bold,
  },
  themeSegmentTextActiveNight: {
    color: '#38bdf8',
    fontFamily: FONT.bold,
  },

  langPickerDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  langOptionDay: {
    color: '#64748b',
  },
  langOptionActiveDay: {
    color: '#059669',
    fontFamily: FONT.bold,
  },
  langDividerDay: {
    color: '#cbd5e1',
  },
  loginBtnDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('#0f172a', 'xs'),
  },
  loginBtnTextDay: {
    color: '#0f172a',
  },

  // Daylight Orbs
  glowOrbSunDay: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(254, 240, 138, 0.22)',
    top: -90,
    left: -70,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(100px)' } as any) : {}),
  },
  glowOrbSkyDay: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(186, 230, 253, 0.25)',
    bottom: -40,
    right: -50,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(100px)' } as any) : {}),
  },
  glowOrbPastureDay: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(187, 247, 208, 0.25)',
    top: 180,
    right: 80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(80px)' } as any) : {}),
  },
  glowOrbDawnDay: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(254, 215, 170, 0.2)',
    bottom: 60,
    left: 80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(80px)' } as any) : {}),
  },

  // Hero Left Day
  osBadgeDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  osBadgeDotDay: {
    backgroundColor: '#059669',
  },
  osBadgeTextDay: {
    color: '#047857',
  },
  heroMainTitleDay: {
    color: '#0f172a',
  },
  heroSubTitleDay: {
    color: '#475569',
  },

  // Mandi Discovery Day
  mandiDiscoveryCardDay: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 1.5,
    ...(Platform.OS === 'web'
      ? ({
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 45%, #ffffff 100%)',
          boxShadow: '0 12px 30px -6px rgba(5, 150, 105, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.25), inset 0 1px 2px #ffffff',
        } as any)
      : {
          ...premiumShadow('rgba(5, 150, 105, 0.2)', 'md'),
        }),
  },
  mandiCardTitleDay: {
    color: '#064e3b',
  },
  liveBadgeMiniDay: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  liveBadgeMiniTextDay: {
    color: '#047857',
  },
  mandiRate4DBtnDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
    ...(Platform.OS === 'web'
      ? ({
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 60%, #a7f3d0 100%)',
          boxShadow: '0 3px 10px rgba(5, 150, 105, 0.28), inset 0 1px 1px #ffffff',
          transform: 'perspective(400px) translateZ(2px)',
        } as any)
      : {
          elevation: 4,
          shadowColor: '#059669',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        }),
  },
  mandiRate4DBtnTextDay: {
    color: '#047857',
  },
  fourDBtnPillDay: {
    backgroundColor: '#d1fae5',
  },
  fourDBtnPillTextDay: {
    color: '#047857',
  },
  // ─── Continuous Upward Mandi Ticker Day Mode Styles ───────────────────
  mandiRollerSlotDay: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    borderWidth: 1.5,
    ...premiumShadow('rgba(16, 185, 129, 0.12)', 'xs'),
  },
  mandiRollerRowItemDay: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  rollerCropBadgeDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
    borderWidth: 1.2,
  },
  rollerCropTextDay: {
    color: '#064e3b',
  },
  rollerCropPunjabiTagDay: {
    color: '#047857',
  },
  rollerVarietyTextDay: {
    color: '#64748b',
  },
  rollerMandiNameDay: {
    color: '#0f172a',
  },
  rollerStateSubDay: {
    color: '#475569',
  },
  rollerPriceValDay: {
    color: '#047857',
  },
  rollerPriceUnitDay: {
    color: '#64748b',
  },
  rollerTrendPillDay: {
    backgroundColor: '#d1fae5',
  },
  rollerTrendTextDay: {
    color: '#047857',
  },
  rollerCounterTextDay: {
    color: '#475569',
  },
  upwardMovingIndicatorBadgeDay: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  upwardMovingIndicatorTextDay: {
    color: '#047857',
  },

  // ─── Verified APMC Footer Day Mode ─────────────────────────────────────
  mandiVerifiedFooterDay: {
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  mandiVerifiedTextDay: {
    color: '#475569',
  },
  mandiVerifiedLinkDay: {
    color: '#047857',
  },
  officialModalCardDay: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(5, 150, 105, 0.35)',
    ...premiumShadow('#0f172a', 'lg'),
  },
  officialModalIconCircleDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  officialModalTitleDay: {
    color: '#0f172a',
  },
  officialModalSubDay: {
    color: '#64748b',
  },
  officialModalCloseBtnDay: {
    padding: 4,
  },
  officialPerksListDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  officialPerkTextDay: {
    color: '#1e293b',
  },
  officialModalSecondaryBtnDay: {
    alignItems: 'center',
    paddingVertical: 7,
  },
  officialModalSecondaryTextDay: {
    color: '#64748b',
  },
  primaryBtnContainerDay: {
    ...premiumShadow('#10b981', 'md'),
  },
  btnPrimaryTextDay: {
    color: '#ffffff',
  },
  btnSecondaryDay: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    ...premiumShadow('#0f172a', 'xs'),
  },
  btnSecondaryTextDay: {
    color: '#0f172a',
  },
  trustStatsBarDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'xs'),
  },
  statDividerDay: {
    backgroundColor: '#e2e8f0',
  },
  statLabelDay: {
    color: '#64748b',
  },

  // 3D Showcase Frame Day
  showcaseFrameDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    ...premiumShadow('#0f172a', 'lg'),
  },
  showcaseTopBarDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: '#e2e8f0',
  },
  showcaseTopTextDay: {
    color: '#047857',
  },
  showcaseGpsBadgeDay: {
    backgroundColor: '#f1f5f9',
  },
  showcaseGpsTextDay: {
    color: '#0284c7',
  },
  overlayTelemetryBadgeDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'md'),
  },
  overlayBadgeTitleDay: {
    color: '#0f172a',
  },
  overlayBadgeSubDay: {
    color: '#475569',
  },
  telemetrySignalBadgeDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  telemetrySignalTextDay: {
    color: '#047857',
  },

  // Four Pillars Day
  sectionBadgeRowDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  sectionBadgeDotDay: {
    backgroundColor: '#059669',
  },
  sectionEyebrowDay: {
    color: '#047857',
  },
  sectionHeadlineDay: {
    color: '#0f172a',
  },
  sectionSubheadDay: {
    color: '#475569',
  },
  pillarCardOrigDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    ...premiumShadow('#0f172a', 'md'),
  },
  origCardArrowBadgeDay: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderColor: 'rgba(15, 23, 42, 0.1)',
  },
  origCardTitleDay: {
    color: '#0f172a',
  },
  origCardSubtitleDay: {
    color: '#475569',
  },
  origPillBtnFarmingDay: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  origPillBtnFarmingTextDay: {
    color: '#92400e',
  },
  origPillBtnGardeningDay: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(219, 39, 119, 0.4)',
  },
  origPillBtnGardeningTextDay: {
    color: '#9d174d',
  },
  origPillBtnCropDoctorsDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(5, 150, 105, 0.45)',
  },
  origPillBtnCropDoctorsTextDay: {
    color: '#065f46',
  },
  origPillBtnAgriStoreDay: {
    backgroundColor: 'rgba(14, 165, 233, 0.14)',
    borderColor: 'rgba(2, 132, 199, 0.45)',
  },
  origPillBtnAgriStoreTextDay: {
    color: '#0369a1',
  },

  // Footer Day
  footerDay: {
    borderTopColor: '#e2e8f0',
  },
  footerBrandDay: {
    color: '#0f172a',
  },
  footerCopyDay: {
    color: '#64748b',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESPONSIVE NAVIGATION DRAWER & MOBILE CONTROLS
  // ══════════════════════════════════════════════════════════════════════════
  menuToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuToggleBtnDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  // ─── Mobile Docked Bottom App Bar ───────────────────────────────────────────
  mobileBottomBar: {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(6, 14, 32, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 2,
    zIndex: 9999,
    ...premiumShadow('#000000', 'lg'),
  },
  mobileBottomBarDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'md'),
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  bottomTabText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 3,
  },
  bottomTabTextDay: {
    color: '#64748b',
  },
  bottomTabTextActive: {
    color: '#34d399',
    fontFamily: FONT.bold,
  },
  bottomTabTextActiveDay: {
    color: '#047857',
  },
  bottomTabActiveDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34d399',
  },
  bottomTabActiveDotDay: {
    backgroundColor: '#047857',
  },
  tabIconWrapper: {
    position: 'relative',
  },
  mandiLiveBeaconDot: {
    position: 'absolute',
    top: -1,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  bottomCenterActionTab: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    paddingHorizontal: 6,
  },
  bottomCenterActionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#060e20',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomCenterActionText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#34d399',
    marginTop: 4,
  },
  bottomCenterActionTextDay: {
    color: '#047857',
  },

  // ─── App-Style Navigation Sheet Modal ───────────────────────────────────────
  modalOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  appDrawerContainer: {
    maxHeight: '90%',
    backgroundColor: '#0a1428',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    ...premiumShadow('#000000', 'xl'),
  },
  appDrawerContainerDay: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'lg'),
  },
  sheetHandleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHandleBarDay: {
    backgroundColor: '#cbd5e1',
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerLogoImg: {
    width: 38,
    height: 38,
  },
  drawerBrandText: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  drawerBrandTextDay: {
    color: '#0f172a',
  },
  drawerSubBrandText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  drawerSubBrandTextDay: {
    color: '#64748b',
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseBtnDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  drawerScrollContent: {
    paddingBottom: 20,
  },
  drawerUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 18,
  },
  drawerUserBannerDay: {
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  drawerUserIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerUserIconBoxDay: {
    backgroundColor: '#d1fae5',
  },
  drawerUserTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  drawerUserTitleDay: {
    color: '#0f172a',
  },
  drawerUserSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  drawerUserSubDay: {
    color: '#64748b',
  },
  drawerUserActionBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  drawerUserActionBtnDay: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  drawerUserActionText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#6ee7b7',
  },
  drawerUserActionTextDay: {
    color: '#ffffff',
  },
  drawerSectionLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  drawerSectionLabelDay: {
    color: '#475569',
  },
  appModulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  appModuleTile: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'flex-start',
  },
  appModuleTileDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  appModuleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appModuleTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    marginBottom: 2,
  },
  appModuleTitleDay: {
    color: '#0f172a',
  },
  appModuleDesc: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  appModuleDescDay: {
    color: '#64748b',
  },
  drawerPreferencesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
  },
  drawerPreferencesCardDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  drawerPrefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  drawerPrefLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  drawerPrefLabelDay: {
    color: '#334155',
  },
  drawerPrefDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
  },
  drawerPrefDividerDay: {
    backgroundColor: '#e2e8f0',
  },
  drawerLangChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  drawerHelplineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  drawerHelplineStripDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  drawerHelplineText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  drawerHelplineTextDay: {
    color: '#047857',
  },
  drawerMainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    ...premiumShadow('#10b981', 'sm'),
  },
  drawerMainActionBtnDay: {
    backgroundColor: '#059669',
  },
  drawerMainActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  mobileLangChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  mobileLangChipDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  mobileLangChipActiveDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#059669',
  },
  mobileLangChipActiveNight: {
    backgroundColor: 'rgba(167, 243, 208, 0.2)',
    borderColor: '#a7f3d0',
  },
  mobileLangChipText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },

  // Responsive Pillars Breakpoints
  pillarCardOrigTablet: {
    flexBasis: '47%',
    minWidth: '47%',
    maxWidth: '48%',
  },
  pillarCardOrigMobile: {
    flexBasis: '100%',
    minWidth: '100%',
    maxWidth: '100%',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTELLIGENT FEATURES GRID
  // ══════════════════════════════════════════════════════════════════════════
  featuresSection: {
    paddingVertical: 48,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  featureCard: {
    flex: 1,
    minWidth: 240,
    maxWidth: 300,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: RADIUS.xl,
    padding: 20,
    ...premiumShadow('#000000', 'md'),
  },
  featureCardTablet: {
    flexBasis: '47%',
    minWidth: '47%',
    maxWidth: '48%',
  },
  featureCardMobile: {
    flexBasis: '100%',
    minWidth: '100%',
    maxWidth: '100%',
  },
  featureCardDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(226, 232, 240, 0.95)',
    ...premiumShadow('#0f172a', 'sm'),
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureBadgeRow: {
    marginBottom: 8,
  },
  featureBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.8,
  },
  featureTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginBottom: 8,
  },
  featureTitleDay: {
    color: '#0f172a',
  },
  featureDesc: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 18,
  },
  featureDescDay: {
    color: '#475569',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VERIFIED CULTIVATOR TESTIMONIALS
  // ══════════════════════════════════════════════════════════════════════════
  testimonialsSection: {
    paddingVertical: 48,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  testimonialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    justifyContent: 'center',
  },
  testimonialCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 390,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.xl,
    padding: 22,
    ...premiumShadow('#000000', 'md'),
  },
  testimonialCardTablet: {
    flexBasis: '100%',
    minWidth: '100%',
    maxWidth: '100%',
  },
  testimonialCardMobile: {
    flexBasis: '100%',
    minWidth: '100%',
    maxWidth: '100%',
  },
  testimonialCardDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(226, 232, 240, 0.9)',
    ...premiumShadow('#0f172a', 'xs'),
  },
  testiStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  testiMetricBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  testiMetricText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  testiQuote: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#e2e8f0',
    lineHeight: 20,
    marginBottom: 16,
  },
  testiQuoteDay: {
    color: '#334155',
  },
  testiAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testiAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testiAvatarText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  testiAuthorName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  testiAuthorNameDay: {
    color: '#0f172a',
  },
  testiAuthorLocation: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#64748b',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // APP CALLOUT BANNER
  // ══════════════════════════════════════════════════════════════════════════
  appBannerWrapper: {
    paddingVertical: 24,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  appBannerCard: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 243, 208, 0.25)',
    padding: 32,
    flexDirection: 'row',
    alignItems: 'center',
    ...premiumShadow('#000000', 'lg'),
  },
  appBannerCardDay: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
    ...premiumShadow('#0f172a', 'md'),
  },
  appBannerLeft: {
    zIndex: 10,
  },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(167, 243, 208, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  bannerTagDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  bannerTagText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    letterSpacing: 0.8,
  },
  bannerHeadline: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 8,
  },
  bannerHeadlineDay: {
    color: '#0f172a',
  },
  bannerSubhead: {
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 20,
    maxWidth: 580,
    marginBottom: 20,
  },
  bannerSubheadDay: {
    color: '#475569',
  },
  bannerCtasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  bannerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#a7f3d0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    ...premiumShadow('#a7f3d0', 'md'),
  },
  bannerBtnPrimaryText: {
    color: '#022c22',
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
  },
  bannerBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  bannerBtnSecondaryDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  bannerBtnSecondaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  bannerRight: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPreviewBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.3)',
    borderRadius: RADIUS.xl,
    padding: 18,
  },
  qrPreviewBoxDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  qrScanText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginTop: 8,
  },
  qrSubText: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COMPREHENSIVE RESPONSIVE FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  footerColumnsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 28,
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: '5%',
    paddingBottom: 32,
  },
  footerCol: {
    flex: 1,
    minWidth: 200,
  },
  footerColTablet: {
    flexBasis: '45%',
    minWidth: '45%',
  },
  footerColMobile: {
    flexBasis: '100%',
    minWidth: '100%',
    marginBottom: 18,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  footerLogoImg: {
    width: 28,
    height: 28,
  },
  footerBrandName: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  footerBrandNameDay: {
    color: '#0f172a',
  },
  footerDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  footerDescDay: {
    color: '#475569',
  },
  apmcBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  apmcBadgeRowDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  apmcBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  footerColTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  footerColTitleDay: {
    color: '#0f172a',
  },
  footerLink: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginBottom: 9,
  },
  footerLinkDay: {
    color: '#64748b',
  },
  helplineNum: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#10b981',
    marginBottom: 4,
  },
  helplineNumDay: {
    color: '#059669',
  },
  helplineSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginBottom: 10,
  },
  helplineSubDay: {
    color: '#64748b',
  },
  footerContactEmail: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#bae6fd',
    marginBottom: 4,
  },
  footerContactEmailDay: {
    color: '#0284c7',
  },
  footerContactAddr: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  footerContactAddrDay: {
    color: '#64748b',
  },
  footerBottomRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 18,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerBottomRowDay: {
    borderTopColor: '#e2e8f0',
  },
  footerCopyText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  footerCopyTextDay: {
    color: '#64748b',
  },
  securityBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  securityBadgeItem: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  legalComplianceBox: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: '5%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 18,
    marginBottom: 24,
    gap: 10,
  },
  legalComplianceBoxDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'xs'),
  },
  legalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  legalGovBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  legalGovBadgeDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  legalGovBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.4,
  },
  legalGovBadgeTextDay: {
    color: '#059669',
  },
  legalCinNotice: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  legalCinNoticeDay: {
    color: '#64748b',
  },
  legalParagraph: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 17,
  },
  legalParagraphDay: {
    color: '#475569',
  },
  grievanceDeskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 10,
    marginTop: 4,
  },
  grievanceDeskRowDay: {
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  grievanceDeskText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#e2e8f0',
    lineHeight: 16,
  },
  grievanceDeskTextDay: {
    color: '#0f172a',
  },

  // ── Social Proof Stars Badge (Localized by state/IP) ──
  socialProofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: RADIUS.pill,
    marginBottom: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  socialProofBadgeDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
    ...premiumShadow('rgba(0,0,0,0.06)', 'sm'),
  },
  socialProofBadgeNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
    ...premiumShadow('rgba(0,0,0,0.4)', 'sm'),
  },
  starsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScoreText: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
  },
  ratingScoreTextDay: { color: '#0f172a' },
  ratingScoreTextNight: { color: '#ffffff' },
  socialProofDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 2,
  },
  socialProofDividerDay: { backgroundColor: '#cbd5e1' },
  socialProofDividerNight: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  socialProofText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  socialProofTextDay: { color: '#047857' },
  socialProofTextNight: { color: '#a7f3d0' },

  // ── Wide Glowing "Get Started Free" Button ──
  primaryBtnContainerWide: {
    minWidth: 240,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.7)',
  },
  primaryBtnContainerNight: {
    ...premiumShadow('#10b981', 'lg'),
  },
  btnPrimaryWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  btnPrimarySparkleWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.6)',
  },
  btnPrimaryTextBox: {
    flexDirection: 'column',
  },
  btnPrimaryTextWide: {
    color: '#ffffff',
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  btnPrimarySubWide: {
    color: '#d1fae5',
    fontSize: 9,
    fontFamily: FONT.semiBold,
    letterSpacing: 0.2,
  },
  btnPrimaryArrowPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  // ── 4 Pillars Micro Value Badges ──
  pillarMicroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  pillarMicroBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  // Farming Badge
  pillarMicroBadgeFarmingDay: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  pillarMicroBadgeFarmingNight: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  pillarMicroBadgeTextFarmingDay: { color: '#b45309' },
  pillarMicroBadgeTextFarmingNight: { color: '#fde68a' },

  // Gardening Badge
  pillarMicroBadgeGardeningDay: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  pillarMicroBadgeGardeningNight: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: 'rgba(244, 114, 182, 0.45)',
  },
  pillarMicroBadgeTextGardeningDay: { color: '#be185d' },
  pillarMicroBadgeTextGardeningNight: { color: '#fbcfe8' },

  // Crop Doctors Badge
  pillarMicroBadgeCropDoctorsDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  pillarMicroBadgeCropDoctorsNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  pillarMicroBadgeTextCropDoctorsDay: { color: '#047857' },
  pillarMicroBadgeTextCropDoctorsNight: { color: '#a7f3d0' },

  // Agri Store Badge
  pillarMicroBadgeAgriStoreDay: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.35)',
  },
  pillarMicroBadgeAgriStoreNight: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  pillarMicroBadgeTextAgriStoreDay: { color: '#0369a1' },
  pillarMicroBadgeTextAgriStoreNight: { color: '#bae6fd' },

  // ── Floating Live Social Proof Activity Ticker ──
  liveTickerFixedContainer: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 24,
    left: 20,
    zIndex: 900,
    maxWidth: 380,
  },
  liveTickerFixedContainerMobile: {
    bottom: 74,
    left: 10,
    right: 10,
    maxWidth: '95%',
  },
  liveTickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1.2,
  },
  liveTickerCardDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    ...premiumShadow('rgba(0, 0, 0, 0.08)', 'md'),
  },
  liveTickerCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    ...premiumShadow('rgba(0, 0, 0, 0.65)', 'md'),
  },
  liveTickerLeftCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTickerEmojiCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  liveTickerPulseDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  liveTickerBody: {
    flex: 1,
    justifyContent: 'center',
  },
  liveTickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveTickerFarmerName: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
  },
  liveTickerFarmerNameDay: { color: '#0f172a' },
  liveTickerFarmerNameNight: { color: '#f8fafc' },
  liveTickerLocationText: {
    fontSize: 10,
    fontFamily: FONT.medium,
  },
  liveTickerLocationTextDay: { color: '#64748b' },
  liveTickerLocationTextNight: { color: '#94a3b8' },
  liveTickerActionText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    marginTop: 1,
  },
  liveTickerActionTextDay: { color: '#059669' },
  liveTickerActionTextNight: { color: '#34d399' },
  liveTickerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveTickerDetailText: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  liveTickerBullet: {
    fontSize: 8.5,
    color: '#94a3b8',
  },
  liveTickerTimeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#f59e0b',
  },
  liveTickerCloseBtn: {
    padding: 3,
    marginLeft: 2,
  },

  // ── 5-Second AI Doctor Interactive Demo Styles ──
  aiDoctorDemoSection: {
    width: '100%',
    marginVertical: 20,
  },
  aiDoctorDemoCard: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1.5,
  },
  aiDoctorDemoCardDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    ...premiumShadow('rgba(16, 185, 129, 0.15)', 'lg'),
  },
  aiDoctorDemoCardNight: {
    backgroundColor: 'rgba(11, 23, 20, 0.94)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    ...premiumShadow('rgba(0, 0, 0, 0.65)', 'xl'),
  },
  aiDoctorHeader: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 18,
  },
  aiDoctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    marginBottom: 10,
    borderWidth: 1,
  },
  aiDoctorBadgeDay: {
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  aiDoctorBadgeNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  aiDoctorBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.8,
  },
  aiDoctorBadgeTextDay: { color: '#047857' },
  aiDoctorBadgeTextNight: { color: '#6ee7b7' },
  aiDoctorLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  aiDoctorLiveTagText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#34d399',
    letterSpacing: 0.5,
  },
  aiDoctorTitle: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  aiDoctorTitleDay: { color: '#0f172a' },
  aiDoctorTitleNight: { color: '#ffffff' },
  aiDoctorSubhead: {
    fontSize: 13,
    fontFamily: FONT.medium,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 620,
    lineHeight: 19,
  },
  aiDoctorSubheadDay: { color: '#475569' },
  aiDoctorSubheadNight: { color: '#94a3b8' },

  // Samples Grid
  aiDoctorSamplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
    justifyContent: 'center',
  },
  aiDoctorSampleTab: {
    flex: 1,
    minWidth: 180,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  aiDoctorSampleTabDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  aiDoctorSampleTabNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aiDoctorSampleTabActiveDay: {
    backgroundColor: '#ffffff',
    ...premiumShadow('rgba(0, 0, 0, 0.08)', 'sm'),
  },
  aiDoctorSampleTabActiveNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    ...premiumShadow('rgba(0, 0, 0, 0.4)', 'sm'),
  },
  aiDoctorSampleTabTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiDoctorSampleNumBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  aiDoctorSampleNumText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.3,
  },
  aiDoctorSampleCrop: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  aiDoctorSampleCropDay: { color: '#1e293b' },
  aiDoctorSampleCropNight: { color: '#f8fafc' },
  aiDoctorSampleDisease: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    marginTop: 2,
  },
  aiDoctorSamplePunjabi: {
    fontSize: 10,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  aiDoctorSamplePunjabiDay: { color: '#64748b' },
  aiDoctorSamplePunjabiNight: { color: '#94a3b8' },
  aiDoctorTapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginTop: 8,
  },
  aiDoctorTapPillText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },

  // Scanner Viewport
  aiScannerViewport: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: 180,
    position: 'relative',
  },
  aiScannerViewportDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  aiScannerViewportNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  aiScanningStateBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiScanningCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 420,
  },
  aiScanningStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  aiScanningStatusText: {
    color: '#38bdf8',
    fontSize: 12,
    fontFamily: FONT.bold,
    textAlign: 'center',
  },
  aiProgressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  aiProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Diagnostic Report Box
  aiDiagnosticReportBox: {
    padding: 16,
  },
  aiReportTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  aiReportTitleCol: {
    flex: 1,
  },
  aiReportVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  aiReportBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.6,
  },
  aiAccuracyPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  aiAccuracyText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  aiDiseaseHeadline: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
  },
  aiDiseaseHeadlineDay: { color: '#0f172a' },
  aiDiseaseHeadlineNight: { color: '#ffffff' },
  aiDiseaseSubline: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  aiDiseaseSublineDay: { color: '#475569' },
  aiDiseaseSublineNight: { color: '#cbd5e1' },
  aiCropEmojiBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Prescription Grid
  aiPrescriptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  aiPrescriptionCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  aiPrescriptionCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0, 0, 0, 0.03)', 'xs'),
  },
  aiPrescriptionCardNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiPrescriptionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  aiPrescriptionCardHeaderLabel: {
    color: '#059669',
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  aiPrescriptionMedicineName: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  aiPrescriptionMedicineNameDay: { color: '#0f172a' },
  aiPrescriptionMedicineNameNight: { color: '#f8fafc' },
  aiPrescriptionDosageValue: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  aiPrescriptionDosageValueDay: { color: '#0369a1' },
  aiPrescriptionDosageValueNight: { color: '#38bdf8' },
  aiPrescriptionSymptomsText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 14,
  },

  // Action Buttons
  aiDoctorActionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  aiDoctorOrderBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    ...premiumShadow('#10b981', 'sm'),
  },
  aiDoctorOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  aiDoctorOrderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },
  aiDoctorScanOwnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  aiDoctorScanOwnBtnDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  aiDoctorScanOwnBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  aiDoctorScanOwnBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  aiDoctorScanOwnBtnTextDay: { color: '#0284c7' },
  aiDoctorScanOwnBtnTextNight: { color: '#38bdf8' },

  // ── Mobile App Install Card ──
  mobileAppInstallCard: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  mobileAppInstallCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0, 0, 0, 0.08)', 'sm'),
  },
  mobileAppInstallCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  mobileInstallBigBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...premiumShadow('#10b981', 'md'),
  },
  mobileInstallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  mobileInstallIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileInstallTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  mobileInstallSub: {
    color: '#d1fae5',
    fontSize: 10,
    fontFamily: FONT.semiBold,
    marginTop: 1,
  },
  mobileInstallPerks: {
    color: '#a7f3d0',
    fontSize: 8.5,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  mobileDirectWebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  mobileDirectWebBtnDay: {},
  mobileDirectWebBtnNight: {},
  mobileDirectWebText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    textAlign: 'center',
  },
  mobileDirectWebTextDay: { color: '#0284c7' },
  mobileDirectWebTextNight: { color: '#38bdf8' },

  // ── Floating Quick WhatsApp Support Pill ──
  floatingWhatsAppBtn: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 24,
    right: 20,
    zIndex: 900,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  floatingWhatsAppBtnMobile: {
    bottom: 74,
    right: 12,
  },
  floatingWhatsAppGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8.5,
  },
  whatsAppBeaconWrap: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppBeaconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#25D366',
  },
  whatsAppTextCol: {
    flexDirection: 'column',
  },
  whatsAppTopLabel: {
    color: '#d1fae5',
    fontSize: 7.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.6,
    lineHeight: 9,
  },
  whatsAppMainText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  whatsAppMobileText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT.extraBold,
  },

  // ── 4.9/5 Rating Badge & Audio Advisory Readout Styles ──
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  ratingReviewsCount: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
    marginLeft: 3,
  },
  ratingReviewsCountDay: { color: '#64748b' },
  ratingReviewsCountNight: { color: '#94a3b8' },
  heroAudioReadoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...premiumShadow('rgba(16, 185, 129, 0.2)', 'xs'),
  },
  heroAudioReadoutBtnDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  heroAudioReadoutBtnNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  heroAudioReadoutBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  heroAudioReadoutText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },

  // AI Doctor Audio Button
  aiDoctorAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    ...premiumShadow('rgba(16, 185, 129, 0.15)', 'xs'),
  },
  aiDoctorAudioBtnDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
  },
  aiDoctorAudioBtnNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  aiDoctorAudioBtnPlaying: {
    backgroundColor: '#059669',
    borderColor: '#34d399',
  },
  aiDoctorAudioBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  audioWaveBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
    marginLeft: 3,
  },
  audioWaveBar: {
    width: 2.5,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
});
