import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Linking,
  Animated as RNAnimated,
  LayoutChangeEvent,
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
import { useCart } from '@/src/store/cart-context';
import PublicHeader from '@/components/PublicHeader';
import { MobileHomeView } from '@/components/mobile/MobileHomeView';
import { BrandLogo } from '@/src/components/BrandLogo';
import FarmsKingQRCode from '@/components/FarmsKingQRCode';
import { getSupportContact } from '@/src/api/appSettings.api';
import { LIVE_FARMER_ACTIVITIES, getUnifiedLiveFarmerFeed, recordRealFarmerActivity, getActivityDisplayTime, LiveFarmerActivity } from '@/constants/liveFarmerFeed';

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

  const isTouchDevice =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.innerWidth <= 768 || ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches));
  const canInteract = isInteractive && !isTouchDevice;

  const handleMouseMove = (e: any) => {
    if (Platform.OS !== 'web' || !canInteract) return;
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
    if (Platform.OS !== 'web' || !canInteract) return;
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, isHovered: false });
  };

  const dynamicWebStyle = Platform.OS === 'web' && canInteract ? {
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
            ...(Platform.OS === 'web'
              ? ({
                  background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 75%)`,
                } as any)
              : {}),
            zIndex: 99,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// ── Verified Cultivator Field Success Stories Data with Real Profile Pictures (DPs) ──
export interface CultivatorSuccessStory {
  id: string;
  name: string;
  location: string;
  cropRole: string;
  metric: string;
  metricColor: string;
  quote: string;
  avatarUrl: string;
  initials: string;
  stars: number;
}

const VERIFIED_CULTIVATOR_STORIES: CultivatorSuccessStory[] = [
  {
    id: 'story-1',
    name: 'Sardar Gurmeet Singh',
    location: 'Ludhiana, Punjab',
    cropRole: 'King ID: 16656444 • Progressive Cultivator • Basmati 1121 & Wheat',
    metric: '+24% Yield Gain',
    metricColor: '#10b981',
    quote: 'The satellite moisture maps helped us calibrate canal water cycles with precision. Our Basmati 1121 yield crossed 24 quintals per acre with zero lodging.',
    avatarUrl: '',
    initials: 'GS',
    stars: 5,
  },
  {
    id: 'story-2',
    name: 'Harpreet Singh Dhillon',
    location: 'Khanna, Punjab',
    cropRole: 'King ID: 59091178 • Wheat & Mustard Cultivator • 26 Acres',
    metric: 'Zero Disease Spread',
    metricColor: '#0284c7',
    quote: 'We detected Yellow Rust at the earliest pinhead stage using the Crop Doctor scanner. The exact spray dosage saved our 14-acre wheat crop from devastation.',
    avatarUrl: '',
    initials: 'HD',
    stars: 5,
  },
  {
    id: 'story-3',
    name: 'Baljinder Singh Brar',
    location: 'Bathinda, Punjab',
    cropRole: 'King ID: 21683889 • Direct Mandi Member • 32 Acres',
    metric: '+₹140/q Higher Price',
    metricColor: '#d97706',
    quote: 'Instant mandi pricing allowed us to route our paddy directly to Khanna instead of local village arhtiyas, securing ₹140 more per quintal transparently.',
    avatarUrl: '',
    initials: 'BB',
    stars: 5,
  },
  {
    id: 'story-4',
    name: 'Amrinder Singh Sandhu',
    location: 'Amritsar, Punjab',
    cropRole: 'King ID: 55725971 • Progressive Cultivator • Bt Cotton & Wheat',
    metric: '+₹2.85 Lakh Net Profit',
    metricColor: '#10b981',
    quote: 'Satellite NDVI canopy scans identified micro-nutrient zinc deficiency across our cotton blocks 18 days before visual yellowing, saving our bumper yield.',
    avatarUrl: '',
    initials: 'AS',
    stars: 5,
  },
  {
    id: 'story-5',
    name: 'Manmohan Singh Virk',
    location: 'Karnal, Haryana',
    cropRole: 'King ID: 35683108 • Organic Farm & Floriculture • 18 Acres',
    metric: '3.4x Revenue Growth',
    metricColor: '#f59e0b',
    quote: 'Transitioning acreage to high-value crops with FarmsKing guidance and direct buyer linkages tripled our monthly cash flow compared to conventional farming.',
    avatarUrl: '',
    initials: 'MV',
    stars: 5,
  },
  {
    id: 'story-6',
    name: 'Chandra Mohan',
    location: 'Jind, Haryana',
    cropRole: 'King ID: 27633065 • Smart Irrigation Cultivator • 45 Acres',
    metric: '28% Water Saved',
    metricColor: '#06b6d4',
    quote: 'Precision weather alerts and laser moisture telemetry eliminated 3 redundant tubewell irrigation cycles, cutting electricity and diesel costs substantially.',
    avatarUrl: '',
    initials: 'CM',
    stars: 5,
  },
  {
    id: 'story-7',
    name: 'Kulwant Singh Cheema',
    location: 'Sangrur, Punjab',
    cropRole: 'King ID: 50653620 • Verified Mandi Trader & Cultivator',
    metric: 'Zero Middleman Fee',
    metricColor: '#059669',
    quote: 'Sold 480 quintals through FarmsKing Live Mandi verified buyer network. Transparent weighment settlement arrived straight in our bank account within 24 hours.',
    avatarUrl: '',
    initials: 'KC',
    stars: 5,
  },
  {
    id: 'story-8',
    name: 'Rahul Yadav',
    location: 'Jaipur, Rajasthan',
    cropRole: 'King ID: 20658895 • Mustard & Gram Cultivator • 24 Acres',
    metric: '+19% Crop Recovery',
    metricColor: '#16a34a',
    quote: 'Certified bio-organic inputs and calibrated nutrition schedules from FarmsKing Agri Store revived our soil biology and lifted crop productivity significantly.',
    avatarUrl: '',
    initials: 'RY',
    stars: 5,
  },
];

const TRANSLATIONS = {
  EN: {
    badge: 'FarmsKing (Smart Farming Platform)',
    heroTitle: 'India’s Intelligent Agriculture Ecosystem',
    heroSub: 'Multimodal AI Crop Doctor • Real-Time APMC Mandi Intelligence • 100% Certified Farm Inputs Delivered Direct.',
    getStarted: 'Scan Crop Leaf Free',
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
    fourPillarsTitle: 'Four Pillars of Intelligent Agriculture',
    fourPillarsSub: 'Unified digital agronomy ecosystem designed to maximize yield, diagnose crops in 5 seconds, and eliminate mandi broker friction.',
    appDownloadTitle: 'Experience FarmsKing on Mobile & Web',
    appDownloadSub: 'Scan the universal QR code with any smartphone camera to launch www.farmsking.in directly.',
    scanWithPhone: 'Scan with Smartphone',
    openFarmsKing: 'Universal Web & App QR Code',
    farmerHelpline: 'Farmer Helpline',
    helplineHours: 'Farmer Helpline • 10:00 AM – 5:00 PM IST',
    legalHeading: 'Legal & Compliance',
    mcaDisclosures: 'MCA & Statutory Disclosures',
    returnHome: 'Return to FarmsKing Homepage',
  },
  PA: null as any,
  HI: null as any,
};
TRANSLATIONS.PA = TRANSLATIONS.EN;
TRANSLATIONS.HI = TRANSLATIONS.EN;


// ── Real-Time Dynamic Pan-India Social Proof Farmer Activity Feed ──
// Sourced from @/constants/liveFarmerFeed (240+ diverse Indian cultivators & 16 active seasonal crops)


// ─── Super Premium Interactive AI Crop Doctor Demo Data ───────────────────
const AI_DEMO_DATA = {
  wheat: {
    crop: 'Wheat (Triticum aestivum)',
    shortName: 'Wheat',
    icon: '🌾',
    disease: 'Yellow Rust (Puccinia striiformis)',
    confidence: '99.2%',
    severity: 'Stage 2 • Foliar Pustules Detected',
    remedy: 'Bio-Fungicide (Trichoderma viride 2.5g/L) + Cold-Pressed Neem Oil 1500 PPM',
    yieldImpact: '+18–22% Estimated Yield Recovery',
    mandiPrice: '₹2,425 / Qtl',
    status: 'High Recovery Likelihood',
    statusColor: '#10b981',
    leafBg: '#064e3b',
    accentColor: '#f59e0b',
  },
  paddy: {
    crop: 'Paddy / Rice (Oryza sativa)',
    shortName: 'Paddy',
    icon: '🌱',
    disease: 'Bacterial Leaf Blight (Xanthomonas)',
    confidence: '98.7%',
    severity: 'Stage 1 • Early Leaf Streaks',
    remedy: 'Copper Oxychloride 50% WP (2.5g/L) + Streptocycline (6g / 120L Water)',
    yieldImpact: '+20–25% Estimated Yield Protection',
    mandiPrice: '₹3,150 / Qtl',
    status: 'Early Detection • 100% Curable',
    statusColor: '#10b981',
    leafBg: '#0f766e',
    accentColor: '#38bdf8',
  },
  cotton: {
    crop: 'Cotton (Gossypium)',
    shortName: 'Cotton',
    icon: '☁️',
    disease: 'Pink Bollworm (Pectinophora)',
    confidence: '99.5%',
    severity: 'Stage 2 • Early Larval Entry',
    remedy: 'Pheromone Funnel Traps (5/acre) + Beauveria bassiana 1kg/acre Foliar Spray',
    yieldImpact: '+30% Boll Retention Rate',
    mandiPrice: '₹7,450 / Qtl',
    status: 'Targeted Bio-Control Ready',
    statusColor: '#10b981',
    leafBg: '#1e3a8a',
    accentColor: '#ec4899',
  },
  mustard: {
    crop: 'Mustard / Sarson (Brassica)',
    shortName: 'Mustard',
    icon: '🌼',
    disease: 'White Rust (Albugo candida)',
    confidence: '98.9%',
    severity: 'Stage 1 • White Pustules Underleaf',
    remedy: 'Mancozeb 75% WP @ 2g/L or Micronized Wettable Sulphur (3g/L)',
    yieldImpact: '+15–18% Oil Content Safeguard',
    mandiPrice: '₹5,820 / Qtl',
    status: 'Optimal Spray Window Open',
    statusColor: '#10b981',
    leafBg: '#713f12',
    accentColor: '#eab308',
  },
};

export default function PublicLandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Guard: If authenticated, immediately preserve session & redirect to appropriate dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user.role)) {
        router.replace('/(partner)/(tabs)');
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/(user)/(tabs)');
      }
    }
  }, [user, isLoading]);

  const { items: cartItems } = useCart();
  const totalCartCount = useMemo(() => (cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0), [cartItems]);
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  // ── Bottom Docked Bar Animated Glider State (Admin Mobile Spring Style) ──
  const [selectedDemoCrop, setSelectedDemoCrop] = useState<'wheat' | 'paddy' | 'cotton' | 'mustard'>('wheat');
  
  // Auto-cycle through crops in AI Leaf Scanner to keep live animation running continuously
  useEffect(() => {
    const crops: ('wheat' | 'paddy' | 'cotton' | 'mustard')[] = ['wheat', 'paddy', 'cotton', 'mustard'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % crops.length;
      setSelectedDemoCrop(crops[idx]);
    }, 3800);
    return () => clearInterval(interval);
  }, []);


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
  // Dynamic Live Social Proof Feed with Real Farmer Permanent Persistence
  const [liveActivities, setLiveActivities] = useState<LiveFarmerActivity[]>(() => getUnifiedLiveFarmerFeed());
  const [activeActivityIdx, setActiveActivityIdx] = useState(0);
  const [tickerDismissed, setTickerDismissed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const tickerFadeAnim = useSharedValue(1);
  const tickerSlideAnim = useSharedValue(0);

  useEffect(() => {
    // Listen for new real farmers added anywhere in the app
    const handleRealFarmerUpdate = () => {
      const freshFeed = getUnifiedLiveFarmerFeed();
      setLiveActivities(freshFeed);
      setActiveActivityIdx(0); // Immediately show the newly registered real farmer!
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('farmsking_real_farmer_updated', handleRealFarmerUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('farmsking_real_farmer_updated', handleRealFarmerUpdate);
      }
    };
  }, []);

  // When logged-in user is a FARMER, ensure their real identity is recorded permanently
  useEffect(() => {
    if (user && (user.role === 'FARMER' || (user as any).roles?.includes('FARMER'))) {
      const name = user.farmName || user.name || 'Verified Farmer';
      const location = [user.village, user.district, user.state].filter(Boolean).join(', ') || 'Punjab, India';
      recordRealFarmerActivity({
        name,
        location,
        action: 'Active on FarmsKing Smart Farming Network',
        detail: 'Verified Cultivator • Live Member',
        emoji: '🌾',
        tagColor: '#059669',
      });
    }
  }, [user]);

  // ── Verified Cultivator Field Success Stories State & Real Profile Sync ──
  const [showAllStories, setShowAllStories] = useState(false);

  // Randomize real farmer login profiles on mount
  const [shuffledBaseStories] = useState(() => {
    const arr = [...VERIFIED_CULTIVATOR_STORIES];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const realCultivatorStories = useMemo(() => {
    const list: CultivatorSuccessStory[] = [...shuffledBaseStories];

    // If active user is logged in with a name, prepend their real story at the top
    if (user && user.name && user.name.trim()) {
      const photo = user.photoUrl
        ? (user.photoUrl.startsWith('http') ? user.photoUrl : `/uploads/${user.photoUrl.replace(/^\/uploads\//, '')}`)
        : '';
      const loc = [user.village, user.district, user.state || 'Punjab'].filter(Boolean).join(', ');
      const kingTag = (user as any).kingId ? `King ID: ${(user as any).kingId} • ` : '';
      list.unshift({
        id: `user-${user.id || 'real'}`,
        name: user.name,
        location: loc || 'Punjab, India',
        cropRole: `${kingTag}${user.role === 'FARMER' ? 'Verified Cultivator' : 'Active Member'} • FarmsKing Network`,
        metric: 'Verified Member',
        metricColor: '#10b981',
        quote: 'FarmsKing digital tools and helpline support have made modern farm management transparent, precise, and highly profitable.',
        avatarUrl: photo,
        initials: user.name.slice(0, 2).toUpperCase(),
        stars: 5,
      });
    }

    return list;
  }, [shuffledBaseStories, user?.id, user?.name, user?.photoUrl, user?.village, user?.district, user?.state, user?.role, (user as any)?.kingId]);

  const displayedStories = showAllStories ? realCultivatorStories : realCultivatorStories.slice(0, 3);

  useEffect(() => {
    if (tickerDismissed) return;

    const interval = setInterval(() => {
      tickerFadeAnim.value = withTiming(0, { duration: 320 });
      tickerSlideAnim.value = withTiming(14, { duration: 320 });

      setTimeout(() => {
        setActiveActivityIdx((prev) => (prev + 1) % liveActivities.length);
        tickerSlideAnim.value = -14;
        tickerFadeAnim.value = withTiming(1, { duration: 380 });
        tickerSlideAnim.value = withTiming(0, { duration: 380 });
      }, 340);
    }, 18000); // 18s comfortable viewing cycle

    return () => clearInterval(interval);
  }, [tickerDismissed, liveActivities.length]);

  const tickerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tickerFadeAnim.value,
    transform: [{ translateY: tickerSlideAnim.value }],
  }));

  const currentActivity = liveActivities[activeActivityIdx] || liveActivities[0] || LIVE_FARMER_ACTIVITIES[0];

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected language state
  const [lang, setLang] = useState<'EN' | 'PA' | 'HI'>('EN');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  // Dynamic support contact and app download url fetched from Admin Settings backend
  const [supportContact, setSupportContact] = useState<{ helplinePhone: string; supportEmail: string }>({
    helplinePhone: '95776-22000',
    supportEmail: 'farmskingindia@gmail.com',
  });
  const [appDownloadUrl, setAppDownloadUrl] = useState<string>('https://www.farmsking.in');

  useEffect(() => {
    getSupportContact()
      .then((contact) => {
        if (contact?.helplinePhone || contact?.supportEmail) {
          setSupportContact({
            helplinePhone: contact.helplinePhone || '95776-22000',
            supportEmail: contact.supportEmail || 'farmskingindia@gmail.com',
          });
        }
        if (contact?.appDownloadUrl && contact.appDownloadUrl.trim()) {
          setAppDownloadUrl(contact.appDownloadUrl.trim());
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
    }, 5000);
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
          /* ── Global Viewport Protection (Eliminate Mobile Side-Scrolling) ── */
          html, body, #root {
            overflow-x: hidden !important;
            max-width: 100vw !important;
            width: 100% !important;
          }
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
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            background: linear-gradient(180deg, rgba(28, 38, 54, 0.85) 0%, rgba(15, 23, 42, 0.92) 100%) !important;
            box-shadow: 0 20px 45px -12px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.22) !important;
          }
          .orig-glass-card:hover {
            transform: translateY(-8px) scale(1.015) !important;
            border-color: rgba(16, 185, 129, 0.5) !important;
            box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
          }
          .holo-day-title {
            background: linear-gradient(135deg, #0f172a 0%, #15803d 35%, #0369a1 70%, #0f172a 100%);
            background-size: 250% 250%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: holoNightTextFlow 7s ease infinite;
          }
          .orig-glass-card-day {
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
            box-shadow: 0 14px 34px -8px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(203, 213, 225, 0.9) !important;
            border-color: #cbd5e1 !important;
          }
          .orig-glass-card-day:hover {
            transform: translateY(-8px) scale(1.015) !important;
            border-color: rgba(16, 185, 129, 0.6) !important;
            box-shadow: 0 28px 56px -14px rgba(16, 185, 129, 0.22), 0 0 20px rgba(16, 185, 129, 0.15), inset 0 1px 3px rgba(255, 255, 255, 1) !important;
          }
          @keyframes liveStreamPulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          .live-stream-pulse-beacon {
            animation: liveStreamPulse 2s infinite !important;
          }
          .card-farming:hover {
            border-color: rgba(245, 158, 11, 0.75) !important;
            box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.8), 0 0 28px rgba(245, 158, 11, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
          }
          
          .organic-card-hover {
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .organic-card-hover:hover {
            transform: translateY(-6px) scale(1.015) !important;
            box-shadow: 0 28px 56px -14px rgba(0, 0, 0, 0.8), 0 0 24px rgba(16, 185, 129, 0.25) !important;
          }
          .organic-card-hover-day:hover {
            transform: translateY(-6px) scale(1.015) !important;
            box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(16, 185, 129, 0.18) !important;
          }
          .card-oils:hover {
            border-color: rgba(245, 158, 11, 0.8) !important;
            box-shadow: 0 28px 56px -14px rgba(0, 0, 0, 0.8), 0 0 24px rgba(245, 158, 11, 0.35) !important;
          }
          .card-honey:hover {
            border-color: rgba(234, 88, 12, 0.8) !important;
            box-shadow: 0 28px 56px -14px rgba(0, 0, 0, 0.8), 0 0 24px rgba(234, 88, 12, 0.35) !important;
          }
          .card-grains:hover {
            border-color: rgba(16, 185, 129, 0.8) !important;
            box-shadow: 0 28px 56px -14px rgba(0, 0, 0, 0.8), 0 0 24px rgba(16, 185, 129, 0.35) !important;
          }
          .card-spices:hover {
            border-color: rgba(225, 29, 72, 0.8) !important;
            box-shadow: 0 28px 56px -14px rgba(0, 0, 0, 0.8), 0 0 24px rgba(225, 29, 72, 0.35) !important;
          }
          .alloc-card-hover {
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .alloc-card-hover:hover {
            transform: translateY(-6px) scale(1.01) !important;
          }
          .card-agronomist:hover {
            border-color: rgba(6, 182, 212, 0.8) !important;
            box-shadow: 0 28px 56px -14px rgba(0, 0, 0, 0.8), 0 0 28px rgba(6, 182, 212, 0.35) !important;
          }
          .card-gardener:hover {
            border-color: rgba(225, 29, 72, 0.8) !important;
            box-shadow: 0 28px 56px -14px rgba(0, 0, 0, 0.8), 0 0 28px rgba(225, 29, 72, 0.35) !important;
          }
          .card-farming-day:hover {
            border-color: rgba(217, 119, 6, 0.75) !important;
            box-shadow: 0 28px 56px -14px rgba(245, 158, 11, 0.25), 0 0 24px rgba(245, 158, 11, 0.2), inset 0 1px 3px #ffffff !important;
          }
          .card-gardening:hover {
            border-color: rgba(244, 114, 182, 0.75) !important;
            box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.8), 0 0 28px rgba(244, 114, 182, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
          }
          .card-gardening-day:hover {
            border-color: rgba(219, 39, 119, 0.75) !important;
            box-shadow: 0 28px 56px -14px rgba(244, 114, 182, 0.25), 0 0 24px rgba(244, 114, 182, 0.2), inset 0 1px 3px #ffffff !important;
          }
          .card-cropdoctors:hover {
            border-color: rgba(16, 185, 129, 0.75) !important;
            box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.8), 0 0 28px rgba(16, 185, 129, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
          }
          .card-cropdoctors-day:hover {
            border-color: rgba(5, 150, 105, 0.75) !important;
            box-shadow: 0 28px 56px -14px rgba(16, 185, 129, 0.25), 0 0 24px rgba(16, 185, 129, 0.2), inset 0 1px 3px #ffffff !important;
          }
          .card-agristore:hover {
            border-color: rgba(14, 165, 233, 0.75) !important;
            box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.8), 0 0 28px rgba(14, 165, 233, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
          }
          .card-agristore-day:hover {
            border-color: rgba(2, 132, 199, 0.75) !important;
            box-shadow: 0 28px 56px -14px rgba(14, 165, 233, 0.25), 0 0 24px rgba(14, 165, 233, 0.2), inset 0 1px 3px #ffffff !important;
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
          /* Agronomy Telemetry Scan Cascade */
          @keyframes agronomyScanCascade {
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
          /* Agronomy Telemetry Scan Drift */
          @keyframes agronomyScanDrift {
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
          /* Satellite Navigation Strobes */
          @keyframes satelliteStrobePulse {
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

          /* ── 5-Second Single-Crop Mandi Splash Animation & Progress Pulse ── */
          @keyframes mandiSplashIn {
            0% {
              opacity: 0;
              transform: scale(0.93) translateY(9px);
              filter: blur(4px);
            }
            45% {
              opacity: 0.95;
              transform: scale(1.018) translateY(-1px);
              filter: blur(0px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0px);
            }
          }
          @keyframes mandiProgressCountdown {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }
          .mandi-single-card-window {
            height: 78px !important;
            position: relative !important;
            border-radius: 14px !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            transition: all 0.25s ease !important;
          }
          @media (max-width: 768px) {
            .mandi-single-card-window {
              height: 70px !important;
            }
            .orig-glass-card:hover,
            .orig-glass-card-day:hover,
            .card-farming:hover,
            .card-farming-day:hover,
            .card-gardening:hover,
            .card-gardening-day:hover,
            .card-cropdoctors:hover,
            .card-cropdoctors-day:hover,
            .card-agristore:hover,
            .card-agristore-day:hover,
            .alloc-card-hover:hover,
            .alloc-card-hover.card-agronomist:hover,
            .alloc-card-hover.card-gardener:hover {
              transform: none !important;
              box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.45) !important;
            }
          }
          .mandi-single-card-window:hover {
            transform: translateY(-1.5px) !important;
          }
          .mandi-splash-content {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 8px 12px !important;
            box-sizing: border-box !important;
            animation: mandiSplashIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) both !important;
            will-change: transform, opacity !important;
          }
          @media (max-width: 768px) {
            .mandi-splash-content {
              padding: 6px 8px !important;
              gap: 4px !important;
            }
          }
          .mandi-splash-progressbar {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            height: 3px !important;
            background: linear-gradient(90deg, #10b981, #38bdf8, #34d399) !important;
            box-shadow: 0 0 10px rgba(52, 211, 153, 0.8) !important;
            animation: mandiProgressCountdown 5s linear infinite !important;
            pointer-events: none !important;
            z-index: 5 !important;
          }
          .mandi-single-card-window:hover .mandi-splash-progressbar {
            animation-play-state: paused !important;
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

  // Mobile and Desktop now both render the full web platform with responsive app adaptations
  if (!isLoading && user) {
    return <View style={{ flex: 1, backgroundColor: '#020d06' }} />;
  }

  return (
    <View style={[S.root, isDay && S.rootDay]}>
      {/* ══ UNIFIED PUBLIC FLOATING HEADER (IDENTICAL ACROSS ALL TABS) ══ */}
      <PublicHeader
        themeMode={themeMode}
        onThemeToggle={toggleTheme}
        onCartPress={() => router.push('/shop')}
        cartItemCount={totalCartCount}
      />

      <ScrollView
        contentContainerStyle={[
          S.scrollContainer,
          isMobile ? S.scrollContainerMobile : S.scrollContainerDesktop,
        ]}
        showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
      >
        {/* ══ HERO SECTION (SPLIT 2-COLUMN) ══ */}
        <View style={[S.heroSection, isDesktop ? S.heroDesktop : S.heroMobile]}>
          {/* Subtle Ambient Glowing Baby Light Orbs */}
          <View pointerEvents="none" style={[isDay ? S.glowOrbSunDay : S.glowOrbBabyMint, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim', pointerEvents: 'none' } as any) : {}]} />
          <View pointerEvents="none" style={[isDay ? S.glowOrbSkyDay : S.glowOrbBabyBlue, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim', pointerEvents: 'none' } as any) : {}]} />
          <View pointerEvents="none" style={[isDay ? S.glowOrbPastureDay : S.glowOrbBabyPink, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim', pointerEvents: 'none' } as any) : {}]} />
          <View pointerEvents="none" style={[isDay ? S.glowOrbDawnDay : S.glowOrbBabyPeach, Platform.OS === 'web' ? ({ className: 'orb-breathe-anim', pointerEvents: 'none' } as any) : {}]} />

          {/* Left Column: Clean Headlines & Interactive Mandi Directory */}
          <View style={[S.heroLeft, isDesktop ? { flex: 6 } : { width: '100%' }]}>

            {/* ══ SOCIAL PROOF STARS BADGE (4.9/5 RATING) & AUDIO ADVISORY CHIP ══ */}
            {/* ══ SOCIAL PROOF STARS BADGE (4.9/5 RATING) & AUDIO ADVISORY CHIP (SINGLE TIGHT ROW) ══ */}
            <View style={[S.heroBadgesRow, { gap: 6, marginBottom: isMobile ? 3 : 5, flexWrap: 'wrap' }]}>
              <View
                style={[
                  S.socialProofBadge,
                  isDay ? S.socialProofBadgeDay : S.socialProofBadgeNight,
                  {
                    paddingHorizontal: isMobile ? 7 : 9,
                    paddingVertical: isMobile ? 3 : 4,
                    marginBottom: 0,
                    flexWrap: 'nowrap',
                    maxWidth: '100%',
                  },
                ]}
              >
                <View style={S.starsGroup}>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Ionicons key={i} name="star" size={isMobile ? 9.5 : 12} color="#f59e0b" style={{ marginRight: 1 }} />
                  ))}
                </View>
                <Text style={[S.ratingScoreText, isDay ? S.ratingScoreTextDay : S.ratingScoreTextNight, { fontSize: isMobile ? 10 : 11 }]}>
                  4.9/5
                </Text>
                <Text style={[S.ratingReviewsCount, isDay ? S.ratingReviewsCountDay : S.ratingReviewsCountNight, { fontSize: isMobile ? 8.5 : 9.5 }]}>
                  {isMobile ? '(14.2k)' : '(14,200+ Reviews)'}
                </Text>
                <View style={[S.socialProofDivider, isDay ? S.socialProofDividerDay : S.socialProofDividerNight, { marginHorizontal: isMobile ? 2 : 3 }]} />
                <Ionicons name="shield-checkmark" size={isMobile ? 10 : 12} color={isDay ? '#059669' : '#34d399'} />
                <Text style={[S.socialProofText, isDay ? S.socialProofTextDay : S.socialProofTextNight, { fontSize: isMobile ? 9 : 10.5 }]} numberOfLines={1}>
                  {isMobile ? '48k+ Cultivators' : `Trusted by ${userRegion.farmerCount} Cultivators Across India`}
                </Text>
              </View>

              {/* 🔊 Audio Readout Quick Chip */}
              <TouchableOpacity
                style={[
                  S.heroAudioReadoutBtn,
                  isSpeaking && currentSpeakingId === 'hero-advisory'
                    ? S.heroAudioReadoutBtnActive
                    : (isDay ? S.heroAudioReadoutBtnDay : S.heroAudioReadoutBtnNight),
                  { paddingHorizontal: isMobile ? 7 : 9, paddingVertical: isMobile ? 3 : 4, marginBottom: 0 },
                ]}
                onPress={() => {
                  const speech =
                    'Welcome to FarmsKing Agri Intelligence. Instant 5-second plant doctor diagnosis, live APMC mandi prices across India, and certified farm inputs delivered directly to your farm.';
                  speakText(speech, 'hero-advisory');
                }}
                activeOpacity={0.85}
                accessibilityLabel="Listen to Daily Agri Audio Advisory"
              >
                <Ionicons
                  name={isSpeaking && currentSpeakingId === 'hero-advisory' ? 'volume-high' : 'volume-medium-outline'}
                  size={isMobile ? 11 : 13}
                  color={isSpeaking && currentSpeakingId === 'hero-advisory' ? '#ffffff' : (isDay ? '#059669' : '#34d399')}
                />
                <Text
                  style={[
                    S.heroAudioReadoutText,
                    isSpeaking && currentSpeakingId === 'hero-advisory'
                      ? { color: '#ffffff' }
                      : (isDay ? { color: '#047857' } : { color: '#34d399' }),
                    { fontSize: isMobile ? 9.5 : 10.5 },
                  ]}
                >
                  {isSpeaking && currentSpeakingId === 'hero-advisory'
                    ? 'Speaking...'
                    : (isMobile ? 'Listen' : 'Listen (Advisory)')}
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
                isTablet && { fontSize: 22, lineHeight: 28, marginBottom: 3 },
                isMobile && { fontSize: width < 380 ? 22 : 26, lineHeight: width < 380 ? 28 : 32, marginBottom: 8, letterSpacing: -0.5 },
                !isMobile && !isTablet && { fontSize: 44, lineHeight: 52, marginBottom: 12, letterSpacing: -1 },
                isDay && S.heroMainTitleDay,
                Platform.OS === 'web' ? ({ className: isDay ? 'holo-day-title' : 'holo-night-title' } as any) : {},
              ]}
            >
              {t.heroTitle}
            </Text>

            {/* Sub-Headline */}
            <Text
              style={[
                S.heroSubTitle,
                isMobile && { fontSize: width < 380 ? 12.5 : 13.5, lineHeight: width < 380 ? 18 : 20, marginBottom: 12 },
                !isMobile && { fontSize: 16.5, lineHeight: 26, marginBottom: 18, maxWidth: 640 },
                isDay && S.heroSubTitleDay,
              ]}
            >
              {t.heroSub}
            </Text>

            {/* ══ COMPACT 4D MANDI DIRECTORY TELEMETRY WIDGET ══ */}
            <View nativeID="mandi-rates" {...(Platform.OS === 'web' ? ({ id: 'mandi-rates' } as any) : {})} />
            <SpatialTiltCard
              style={[
                S.mandiDiscoveryCard,
                isDay && S.mandiDiscoveryCardDay,
                isMobile && { padding: 7, marginBottom: 6 },
              ]}
              glowColor={isDay ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.38)'}
              tiltMax={3}
              isInteractive={true}
            >
              {/* ── Top Header Row: Title & 4D Official Rates Action Button ── */}
              <View style={[S.mandiHeaderRow, isMobile && { marginBottom: 3 }]}>
                <View style={S.mandiHeaderTitleGroup}>
                  <Ionicons name="trending-up" size={isMobile ? 14 : 16} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[S.mandiCardTitle, isDay && S.mandiCardTitleDay, isMobile && { fontSize: 12.5 }]}>{t.instantMandi}</Text>
                  <View style={[S.liveBadgeMini, isDay && S.liveBadgeMiniDay, isMobile && { paddingHorizontal: 4, paddingVertical: 1.5 }]}>
                    <View style={[S.pulseDot, Platform.OS === 'web' ? ({ className: 'live-stream-pulse-beacon' } as any) : {}]} />
                    <Text style={[S.liveBadgeMiniText, isDay && S.liveBadgeMiniTextDay, isMobile && { fontSize: 8 }]}>{t.liveApmc}</Text>
                    {!isMobile && (
                      <Text style={[S.liveBadgeMiniLatency, isDay && S.liveBadgeMiniLatencyDay]}>• 1.2s Sync</Text>
                    )}
                  </View>
                </View>

                {/* ── 4D Official Rates Button ── */}
                <TouchableOpacity
                  style={[S.mandiRate4DBtn, isDay && S.mandiRate4DBtnDay, isMobile && { paddingHorizontal: 6, paddingVertical: 2.5 }]}
                  onPress={() => {
                    if (user) {
                      if (['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user?.role || '')) {
                        router.push('/(partner)/(tabs)' as any);
                      } else {
                        router.push('/(user)/(tabs)' as any);
                      }
                    } else {
                      setOfficialRatesModalVisible(true);
                    }
                  }}
                  activeOpacity={0.88}
                  // @ts-ignore
                  className="four-d-official-btn"
                >
                  <Ionicons name="shield-checkmark" size={isMobile ? 10 : 12} color={isDay ? '#047857' : '#34d399'} />
                  <Text style={[S.mandiRate4DBtnText, isDay && S.mandiRate4DBtnTextDay, isMobile && { fontSize: 9.5 }]}>
                    {user ? t.myRates : t.officialRatesBtn}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Quick Commodity 1-Tap Filter Pills ── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8, marginTop: 2 }}>
                {ALL_INDIA_LIVE_MANDI_FEED.slice(0, 5).map((mItem, mIdx) => (
                  <TouchableOpacity
                    key={`quick-mandi-${mIdx}`}
                    onPress={() => setActiveMandiRollIdx(mIdx)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: isMobile ? 8 : 10,
                      paddingVertical: isMobile ? 3.5 : 4.5,
                      borderRadius: RADIUS.pill,
                      backgroundColor:
                        mIdx === activeMandiRollIdx
                          ? (isDay ? 'rgba(5,150,105,0.14)' : 'rgba(52,211,153,0.22)')
                          : (isDay ? '#f1f5f9' : 'rgba(255,255,255,0.06)'),
                      borderWidth: 1,
                      borderColor:
                        mIdx === activeMandiRollIdx
                          ? (isDay ? '#059669' : '#34d399')
                          : (isDay ? '#e2e8f0' : 'rgba(255,255,255,0.08)'),
                    }}
                  >
                    <Text style={{ fontSize: isMobile ? 11 : 12 }}>{mItem.emoji}</Text>
                    <Text
                      style={{
                        fontSize: isMobile ? 10.5 : 11.5,
                        fontFamily: mIdx === activeMandiRollIdx ? FONT.bold : FONT.medium,
                        color:
                          mIdx === activeMandiRollIdx
                            ? (isDay ? '#059669' : '#34d399')
                            : (isDay ? '#475569' : '#94a3b8'),
                      }}
                    >
                      {mItem.crop}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Single Crop 5-Second Splash APMC Mandi Rate Board ── */}
              <TouchableOpacity
                style={[
                  S.mandiRollerSlot,
                  isDay ? S.mandiRollerSlotDay : S.mandiRollerSlotNight,
                  { height: isMobile ? 54 : 76, paddingVertical: 0, paddingHorizontal: 0 },
                ]}
                activeOpacity={0.94}
                onPress={() => {
                  if (user) {
                    if (['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user?.role || '')) {
                      router.push('/(partner)/(tabs)' as any);
                    } else {
                      router.push('/(user)/(tabs)' as any);
                    }
                  } else {
                    setOfficialRatesModalVisible(true);
                  }
                }}
                // @ts-ignore
                className="mandi-single-card-window"
                // @ts-ignore
                onMouseEnter={() => setIsRollPaused(true)}
                // @ts-ignore
                onMouseLeave={() => setIsRollPaused(false)}
              >
                {/* Single Active Crop with Key-driven Splash Animation */}
                {(() => {
                  const item = ALL_INDIA_LIVE_MANDI_FEED[activeMandiRollIdx] || ALL_INDIA_LIVE_MANDI_FEED[0];
                  return (
                    <View
                      key={`mandi-splash-${activeMandiRollIdx}`}
                      style={[
                        S.mandiRollerRowItem,
                        isDay && S.mandiRollerRowItemDay,
                        {
                          height: '100%',
                          width: '100%',
                          borderWidth: 0,
                          backgroundColor: 'transparent',
                          borderRadius: 14,
                          paddingHorizontal: isMobile ? 10 : 14,
                        },
                      ]}
                      // @ts-ignore
                      className="mandi-splash-content"
                    >
                      {/* Left: High-Contrast Crop Badge with Clear Name */}
                      <View
                        style={[
                          S.rollerCropBadge,
                          isDay ? S.rollerCropBadgeDay : S.rollerCropBadgeNight,
                          { flexShrink: 0 },
                          isMobile && { paddingHorizontal: 7, paddingVertical: 4, gap: 5 },
                        ]}
                      >
                        <Text style={{ fontSize: isMobile ? 18 : 22 }}>{item.emoji}</Text>
                        <View style={{ flexDirection: 'column' }}>
                          <Text
                            style={[
                              S.rollerCropText,
                              isDay ? S.rollerCropTextDay : S.rollerCropTextNight,
                              isMobile && { fontSize: 13 },
                            ]}
                            numberOfLines={1}
                          >
                            {item.crop}
                          </Text>
                          <Text
                            style={[
                              S.rollerVarietyText,
                              isDay ? S.rollerVarietyTextDay : S.rollerVarietyTextNight,
                              isMobile && { fontSize: 9.5 },
                            ]}
                            numberOfLines={1}
                          >
                            {item.variety}
                          </Text>
                        </View>
                      </View>

                      {/* Middle: Mandi & State (flex: 1 with minWidth: 0 for reliable text clipping) */}
                      <View
                        style={[
                          S.rollerMandiInfo,
                          { flex: 1, minWidth: 0, flexShrink: 1, overflow: 'hidden' },
                          isMobile && { marginHorizontal: 6 },
                        ]}
                      >
                        <Text
                          style={[
                            S.rollerMandiName,
                            isDay && S.rollerMandiNameDay,
                            isMobile && { fontSize: 11.5 },
                          ]}
                          numberOfLines={1}
                        >
                          📍 {item.mandi}
                        </Text>
                        <Text
                          style={[
                            S.rollerStateSub,
                            isDay && S.rollerStateSubDay,
                            isMobile && { fontSize: 9.5 },
                          ]}
                          numberOfLines={1}
                        >
                          {item.state} • {item.tag}
                        </Text>
                      </View>

                      {/* Right: Live Price & Up Trend (flexShrink: 0) */}
                      <View style={[S.rollerPriceGroup, { flexShrink: 0, alignItems: 'flex-end' }]}>
                        <View style={S.rollerPriceValueRow}>
                          <Text
                            style={[
                              S.rollerPriceVal,
                              isDay ? S.rollerPriceValDay : S.rollerPriceValNight,
                              isMobile && { fontSize: 14.5 },
                            ]}
                          >
                            {item.price}
                          </Text>
                          <Text
                            style={[
                              S.rollerPriceUnit,
                              isDay && S.rollerPriceUnitDay,
                              isMobile && { fontSize: 9.5 },
                            ]}
                          >
                            /{item.unit}
                          </Text>
                        </View>
                        <View
                          style={[
                            S.rollerTrendPill,
                            isDay ? S.rollerTrendPillDay : S.rollerTrendPillNight,
                            isMobile && { paddingHorizontal: 5, paddingVertical: 1.5 },
                          ]}
                        >
                          <Ionicons name="caret-up" size={isMobile ? 10 : 12} color={isDay ? '#047857' : '#34d399'} />
                          <Text style={[S.rollerTrendText, isDay && S.rollerTrendTextDay, isMobile && { fontSize: 9.5 }]}>
                            {item.change}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* 5-Second Splash Progress Countdown Bar */}
                <View
                  key={`prog-line-${activeMandiRollIdx}`}
                  // @ts-ignore
                  className="mandi-splash-progressbar"
                />
              </TouchableOpacity>

              {/* ── Roller Micro Indicators (5-Sec Single Crop Splash Radar) ── */}
              <View style={[S.rollerIndicatorsRow, isMobile && { marginTop: 6, paddingHorizontal: 0 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="pulse" size={11} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[S.rollerCounterText, isDay && S.rollerCounterTextDay, isMobile && { fontSize: 9 }]}>
                    {isMobile ? `Crop ${activeMandiRollIdx + 1}/9 • 5s` : `Crop ${activeMandiRollIdx + 1} of ${ALL_INDIA_LIVE_MANDI_FEED.length} • 5-Sec Splash Cycle`}
                  </Text>
                </View>

                {/* Interactive Crop Dot Indicators */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 3 : 4 }}>
                  {ALL_INDIA_LIVE_MANDI_FEED.map((_, dotIdx) => (
                    <TouchableOpacity
                      key={`mandi-dot-${dotIdx}`}
                      onPress={() => setActiveMandiRollIdx(dotIdx)}
                      activeOpacity={0.7}
                      style={{
                        width: dotIdx === activeMandiRollIdx ? (isMobile ? 11 : 14) : (isMobile ? 3.5 : 4.5),
                        height: isMobile ? 3.5 : 4.5,
                        borderRadius: 2,
                        backgroundColor:
                          dotIdx === activeMandiRollIdx
                            ? (isDay ? '#059669' : '#34d399')
                            : (isDay ? '#cbd5e1' : 'rgba(255, 255, 255, 0.22)'),
                      }}
                    />
                  ))}
                </View>

                <View style={[S.upwardMovingIndicatorBadge, isDay ? S.upwardMovingIndicatorBadgeDay : S.upwardMovingIndicatorBadgeNight, isMobile && { paddingHorizontal: 5, paddingVertical: 1 }]}>
                  <Ionicons name="sparkles" size={9} color={isDay ? '#047857' : '#34d399'} />
                  <Text style={[S.upwardMovingIndicatorText, isDay ? S.upwardMovingIndicatorTextDay : S.upwardMovingIndicatorTextNight, isMobile && { fontSize: 8.5 }]}>
                    LIVE APMC
                  </Text>
                </View>
              </View>

              {/* ── Transparency & Trust Footer Strip ── */}
              <View style={[S.mandiVerifiedFooter, isDay && S.mandiVerifiedFooterDay, isMobile && { marginTop: 6, paddingTop: 6 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                  <Ionicons name="shield-checkmark" size={11} color={isDay ? '#047857' : '#34d399'} />
                  <Text style={[S.mandiVerifiedText, isDay && S.mandiVerifiedTextDay, isMobile && { fontSize: 8.5 }]} numberOfLines={1}>
                    {isMobile ? 'eNAM Verified Live Rates' : 'AGMARKNET & eNAM Synchronized Real-Time Feeds'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setOfficialRatesModalVisible(true)} activeOpacity={0.8}>
                  <Text style={[S.mandiVerifiedLink, isDay && S.mandiVerifiedLinkDay, isMobile && { fontSize: 8.5 }]}>
                    {isMobile ? 'All 9 →' : 'Verify Accuracy →'}
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
                        if (Platform.OS === 'web' && typeof window !== 'undefined') {
                          try {
                            router.push('/(auth)/login' as any);
                          } catch {}
                          setTimeout(() => {
                            if (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/index') {
                              window.location.href = '/login';
                            }
                          }, 60);
                        } else {
                          try {
                            router.push('/(auth)/login' as any);
                          } catch {
                            router.push('/login' as any);
                          }
                        }
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
            <View style={[S.ctaRow, isMobile && { flexDirection: 'row', gap: 6, marginBottom: 6 }]}>
              <TouchableOpacity
                accessibilityRole="link"
                // @ts-ignore
                href={user ? (['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user?.role || '') ? '/(partner)/(tabs)' : '/(user)/(tabs)') : '/ai-doctor'}
                onPress={() => {
                  if (user) {
                    if (['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user?.role || '')) {
                      router.push('/(partner)/(tabs)' as any);
                    } else {
                      router.push('/(user)/(tabs)' as any);
                    }
                  } else {
                    router.push('/ai-doctor');
                  }
                }}
                activeOpacity={0.88}
                style={[
                  S.primaryBtnContainer,
                  S.primaryBtnContainerWide,
                  isDay ? S.primaryBtnContainerDay : S.primaryBtnContainerNight,
                  isMobile && { flex: 1.15, minWidth: 0, width: 'auto' },
                  Platform.OS === 'web' ? ({ className: 'wide-glowing-get-started-btn' } as any) : {},
                ]}
              >
                <LinearGradient
                  colors={['#10b981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[S.btnPrimary, S.btnPrimaryWide, isMobile && { paddingHorizontal: 8, paddingVertical: 7.5, gap: 5 }]}
                >
                  <View style={[S.btnPrimarySparkleWrap, isMobile && { width: 22, height: 22, borderRadius: 11 }]}>
                    <Ionicons name="sparkles" size={isMobile ? 12 : 18} color="#fef08a" />
                  </View>
                  <View style={S.btnPrimaryTextBox}>
                    <Text style={[S.btnPrimaryTextWide, isMobile && { fontSize: 12.5, lineHeight: 16 }]} numberOfLines={1}>
                      {user ? 'Open Farmer Dashboard' : 'Scan Crop Leaf Free'}
                    </Text>
                  </View>
                  <View style={[S.btnPrimaryArrowPill, isMobile && { width: 20, height: 20, borderRadius: 10 }]}>
                    <Ionicons name="arrow-forward" size={isMobile ? 10 : 15} color="#ffffff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="link"
                // @ts-ignore
                href="/shop"
                style={[
                  S.btnSecondary,
                  isDay && S.btnSecondaryDay,
                  isMobile && { flex: 0.85, width: 'auto', justifyContent: 'center', paddingVertical: 7.5, paddingHorizontal: 6, gap: 4 },
                ]}
                onPress={() => router.push('/shop')}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={isMobile ? 13 : 16} color={isDay ? '#0284c7' : '#bae6fd'} />
                <Text style={[S.btnSecondaryText, isDay && S.btnSecondaryTextDay, isMobile && { fontSize: 12 }]} numberOfLines={1}>
                  {t.exploreStore}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Hero Login Assistance Pill */}
            <TouchableOpacity
              style={[S.heroLoginPill, isDay ? S.heroLoginPillDay : S.heroLoginPillNight]}
              onPress={() => {
                if (user) {
                  router.push('/(user)/(tabs)');
                } else {
                  router.push('/login');
                }
              }}
              activeOpacity={0.85}
            >
              <View style={S.heroLoginPulseDot} />
              <Ionicons name="phone-portrait-outline" size={13} color={isDay ? '#047857' : '#34d399'} />
              <Text style={[S.heroLoginPillText, isDay && S.heroLoginPillTextDay]}>
                {user ? `Signed in as ${user.name || user.mobile} • Open Dashboard →` : 'Instant Sign In: Log in with 10-digit mobile number & OTP →'}
              </Text>
            </TouchableOpacity>

            {/* Trust Stats Bar */}
            <View style={[S.trustStatsBar, isDay && S.trustStatsBarDay, isMobile && { justifyContent: 'space-around', gap: 4, paddingTop: 4, marginBottom: 4 }]}>
              <View style={S.statItem}>
                <Text style={[S.statNum, { color: isDay ? '#059669' : '#a7f3d0' }, isMobile && { fontSize: 12 }]}>50,000+</Text>
                <Text style={[S.statLabel, isDay && S.statLabelDay, isMobile && { fontSize: 8 }]}>{t.cultivators}</Text>
              </View>
              <View style={[S.statDivider, isDay && S.statDividerDay]} />
              <View style={S.statItem}>
                <Text style={[S.statNum, { color: isDay ? '#0284c7' : '#bae6fd' }, isMobile && { fontSize: 12 }]}>₹14.8 Cr+</Text>
                <Text style={[S.statLabel, isDay && S.statLabelDay, isMobile && { fontSize: 8 }]}>{t.traded}</Text>
              </View>
              <View style={[S.statDivider, isDay && S.statDividerDay]} />
              <View style={S.statItem}>
                <Text style={[S.statNum, { color: isDay ? '#d97706' : '#fde68a' }, isMobile && { fontSize: 12 }]}>1,200+</Text>
                <Text style={[S.statLabel, isDay && S.statLabelDay, isMobile && { fontSize: 8 }]}>{t.agronomists}</Text>
              </View>
            </View>
          </View>

          {/* Right Column: Clean 3D Living Showcase Frame with Satellite Telemetry Beam, Farmer Tablet Scan HUD, and Breeze Motion */}
          <View style={[S.heroRight, isDesktop ? { flex: 5 } : { width: '100%', marginTop: isMobile ? 4 : 16 }]}>
            <SpatialTiltCard
              style={[S.showcaseFrame, isDay && S.showcaseFrameDay, isMobile && { padding: 4 }]}
              glowColor={isDay ? 'rgba(16, 185, 129, 0.25)' : 'rgba(167, 243, 208, 0.4)'}
              tiltMax={5}
            >
              {/* ── Top Micro-Telemetry HUD Strip ── */}
              <View style={[S.showcaseTopBar, isDay && S.showcaseTopBarDay, isMobile && { paddingHorizontal: 6, paddingVertical: 3 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={S.showcaseLiveDot} />
                  <Text style={[S.showcaseTopText, isDay && S.showcaseTopTextDay, isMobile && { fontSize: 9.5 }]}>
                    {isMobile ? 'AI LIVE TELEMETRY' : 'AI SMART FARM • LIVE TELEMETRY'}
                  </Text>
                </View>
                <View style={[S.showcaseGpsBadge, isDay && S.showcaseGpsBadgeDay, isMobile && { paddingHorizontal: 5, paddingVertical: 2 }]}>
                  <Text style={[S.showcaseGpsText, isDay && S.showcaseGpsTextDay, isMobile && { fontSize: 8.5 }]}>
                    {isMobile ? 'NDVI: 0.88' : 'NDVI CANOPY: 98% OPTIMAL'}
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
                    {/* Agronomy Telemetry Scan Beam */}
                    <div
                      className="telemetry-scan-beam"
                      style={{
                        position: 'absolute',
                        left: '32%',
                        top: '12%',
                        width: '15%',
                        height: '35%',
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(224, 242, 254, 0.92) 0%, rgba(186, 230, 253, 0.55) 45%, rgba(56, 189, 248, 0.25) 70%, transparent 85%)',
                        clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
                        WebkitClipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
                        animation: 'agronomyScanCascade 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                        pointerEvents: 'none',
                        zIndex: 15,
                      }}
                    />

                    {/* Agronomy Telemetry Secondary Scan Wave */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '35.5%',
                        top: '20%',
                        width: '8%',
                        height: '25%',
                        background: 'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0px, transparent 4px, rgba(224, 242, 254, 0.5) 8px, transparent 12px)',
                        animation: 'agronomyScanDrift 1.8s linear infinite',
                        pointerEvents: 'none',
                        zIndex: 16,
                      }}
                    />

                    {/* Satellite Navigation Strobes */}
                    <div
                      className="satellite-beacon-green"
                      style={{
                        position: 'absolute',
                        left: '42.6%',
                        top: '7.8%',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#34d399',
                        boxShadow: '0 0 12px #34d399, 0 0 20px #10b981',
                        animation: 'satelliteStrobePulse 1.8s infinite',
                        pointerEvents: 'none',
                        zIndex: 18,
                      }}
                    />
                    <div
                      className="satellite-beacon-white"
                      style={{
                        position: 'absolute',
                        left: '33.8%',
                        top: '7.8%',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 0 12px #ffffff, 0 0 20px #38bdf8',
                        animation: 'satelliteStrobePulse 1.8s infinite 0.9s',
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
                <View style={[S.overlayTelemetryBadge, isDay && S.overlayTelemetryBadgeDay, isMobile && { bottom: 6, left: 6, right: 6, paddingHorizontal: 8, paddingVertical: 5, gap: 6 }]}>
                  <View style={S.overlayPulseDot} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[S.overlayBadgeTitle, isDay && S.overlayBadgeTitleDay, isMobile && { fontSize: 10, lineHeight: 12 }]} numberOfLines={1}>
                      Crop Health: 98.4% Optimal
                    </Text>
                    <Text style={[S.overlayBadgeSub, isDay && S.overlayBadgeSubDay, isMobile && { fontSize: 8, lineHeight: 10 }]} numberOfLines={1}>
                      {isMobile ? 'Moisture: 42% • Soil Nitrogen: Balanced' : 'Moisture: 42% • Soil Nitrogen: Balanced • GPS Live'}
                    </Text>
                  </View>
                  <View style={[S.telemetrySignalBadge, isDay && S.telemetrySignalBadgeDay, isMobile && { paddingHorizontal: 4, paddingVertical: 1 }]}>
                    <Ionicons name="wifi" size={isMobile ? 8 : 10} color={isDay ? '#047857' : '#a7f3d0'} />
                    <Text style={[S.telemetrySignalText, isDay && S.telemetrySignalTextDay, isMobile && { fontSize: 7.5 }]}>AI Live</Text>
                  </View>
                </View>
              </View>
            </SpatialTiltCard>
          </View>
        </View>

        {/* ══ EXECUTIVE LIVE TELEMETRY METRICS STRIP ══ */}
        <View style={[S.telemetryStripSection, isDay && S.telemetryStripSectionDay, isMobile && S.telemetryStripSectionMobile]}>
          <View style={S.telemetryStripInner}>
            <View style={[S.telemetryStripGrid, isMobile && S.telemetryStripGridMobile]}>
              
              {/* Metric 1: Satellite Acreage */}
              <SpatialTiltCard
                style={[S.telemetryMetricCard, isDay ? S.telemetryMetricCardDay : S.telemetryMetricCardNight, isMobile && S.telemetryMetricCardMobile]}
                glowColor={isDay ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.35)'}
                tiltMax={4}
              >
                <View style={S.metricTopRow}>
                  <View style={[S.metricBadgePill, { backgroundColor: isDay ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.2)' }]}>
                    <View style={[S.pulseDot, { backgroundColor: '#10b981' }]} />
                    <Text style={[S.metricBadgeText, { color: isDay ? '#047857' : '#34d399' }]}>LIVE SATELLITE</Text>
                  </View>
                  <Ionicons name="earth" size={18} color={isDay ? '#059669' : '#10b981'} />
                </View>
                <Text style={[S.metricPrimaryValue, isDay && S.metricPrimaryValueDay]}>50,000+</Text>
                <Text style={[S.metricTitle, isDay && S.metricTitleDay]}>Acres Under Active Telemetry</Text>
                <Text style={[S.metricSubtitle, isDay && S.metricSubtitleDay]}>Continuous NDVI canopy density, soil moisture & weather radar sync</Text>
              </SpatialTiltCard>

              {/* Metric 2: APMC Mandis */}
              <SpatialTiltCard
                style={[S.telemetryMetricCard, isDay ? S.telemetryMetricCardDay : S.telemetryMetricCardNight, isMobile && S.telemetryMetricCardMobile]}
                glowColor={isDay ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.35)'}
                tiltMax={4}
              >
                <View style={S.metricTopRow}>
                  <View style={[S.metricBadgePill, { backgroundColor: isDay ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.2)' }]}>
                    <View style={[S.pulseDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={[S.metricBadgeText, { color: isDay ? '#b45309' : '#fbbf24' }]}>DIRECT APMC</Text>
                  </View>
                  <Ionicons name="trending-up" size={18} color={isDay ? '#d97706' : '#f59e0b'} />
                </View>
                <Text style={[S.metricPrimaryValue, isDay && S.metricPrimaryValueDay, { color: isDay ? '#b45309' : '#fbbf24' }]}>50+ Mandis</Text>
                <Text style={[S.metricTitle, isDay && S.metricTitleDay]}>Real-Time Auction Price Stream</Text>
                <Text style={[S.metricSubtitle, isDay && S.metricSubtitleDay]}>Punjab, Haryana, Rajasthan & MP yard rates with 0% hidden middleman cuts</Text>
              </SpatialTiltCard>

              {/* Metric 3: AI Diagnosis Latency */}
              <SpatialTiltCard
                style={[S.telemetryMetricCard, isDay ? S.telemetryMetricCardDay : S.telemetryMetricCardNight, isMobile && S.telemetryMetricCardMobile]}
                glowColor={isDay ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.35)'}
                tiltMax={4}
              >
                <View style={S.metricTopRow}>
                  <View style={[S.metricBadgePill, { backgroundColor: isDay ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.2)' }]}>
                    <View style={[S.pulseDot, { backgroundColor: '#06b6d4' }]} />
                    <Text style={[S.metricBadgeText, { color: isDay ? '#0e7490' : '#22d3ee' }]}>VISION AI</Text>
                  </View>
                  <Ionicons name="sparkles" size={18} color={isDay ? '#0891b2' : '#06b6d4'} />
                </View>
                <Text style={[S.metricPrimaryValue, isDay && S.metricPrimaryValueDay, { color: isDay ? '#0284c7' : '#38bdf8' }]}>&lt; 5 Seconds</Text>
                <Text style={[S.metricTitle, isDay && S.metricTitleDay]}>Instant AI Leaf Diagnosis</Text>
                <Text style={[S.metricSubtitle, isDay && S.metricSubtitleDay]}>Edge pathology vision model validated across 100,000+ field plant samples</Text>
              </SpatialTiltCard>

              {/* Metric 4: System Reliability */}
              <SpatialTiltCard
                style={[S.telemetryMetricCard, isDay ? S.telemetryMetricCardDay : S.telemetryMetricCardNight, isMobile && S.telemetryMetricCardMobile]}
                glowColor={isDay ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.35)'}
                tiltMax={4}
              >
                <View style={S.metricTopRow}>
                  <View style={[S.metricBadgePill, { backgroundColor: isDay ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.2)' }]}>
                    <View style={[S.pulseDot, { backgroundColor: '#8b5cf6' }]} />
                    <Text style={[S.metricBadgeText, { color: isDay ? '#6d28d9' : '#a78bfa' }]}>RELIABILITY</Text>
                  </View>
                  <Ionicons name="shield-checkmark" size={18} color={isDay ? '#7c3aed' : '#8b5cf6'} />
                </View>
                <Text style={[S.metricPrimaryValue, isDay && S.metricPrimaryValueDay, { color: isDay ? '#6d28d9' : '#c084fc' }]}>99.8%</Text>
                <Text style={[S.metricTitle, isDay && S.metricTitleDay]}>Agronomy Network Uptime</Text>
                <Text style={[S.metricSubtitle, isDay && S.metricSubtitleDay]}>Mission-critical advisory infrastructure with rapid-response agronomist desks</Text>
              </SpatialTiltCard>

            </View>
          </View>
        </View>

        {/* ══ OFFICIAL INSTITUTIONAL & ISO COMPLIANCE TRUST RIBBON ══ */}
        <View style={[S.isoTrustSection, isDay && S.isoTrustSectionDay, isMobile && S.isoTrustSectionMobile]}>
          <View style={S.isoTrustInner}>
            
            {/* Header Badge & Title */}
            <View style={S.isoHeaderContainer}>
              <View style={[S.isoBadgeChip, isDay ? S.isoBadgeChipDay : S.isoBadgeChipNight]}>
                <Ionicons name="shield-checkmark" size={14} color={isDay ? '#047857' : '#34d399'} />
                <Text style={[S.isoBadgeChipText, isDay ? S.isoBadgeChipTextDay : S.isoBadgeChipTextNight]}>
                  INSTITUTIONAL GOVERNANCE &amp; STATUTORY INTEGRITY
                </Text>
              </View>
              <Text style={[S.isoMainHeading, isDay && S.isoMainHeadingDay, isMobile && { fontSize: 22, lineHeight: 28 }]}>
                Standardized Enterprise Quality &amp; Data Governance
              </Text>
              <Text style={[S.isoSubHeading, isDay && S.isoSubHeadingDay, isMobile && { fontSize: 13, lineHeight: 18 }]}>
                FarmsKing operates under certified quality benchmarks, statutory corporate registration, and rigorous agricultural security protocols.
              </Text>
            </View>

            {/* 4 Trust Badges Grid */}
            <View style={[S.isoGrid, isMobile && S.isoGridMobile]}>
              
              {/* Card 1: ISO 9001:2015 */}
              <View style={[S.isoCard, isDay ? S.isoCardDay : S.isoCardNight, isMobile && S.isoCardMobile]}>
                <View style={[S.isoIconWrapper, { backgroundColor: isDay ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.18)' }]}>
                  <Ionicons name="ribbon" size={24} color={isDay ? '#059669' : '#34d399'} />
                </View>
                <View style={S.isoCardContent}>
                  <View style={S.isoCardTitleRow}>
                    <Text style={[S.isoCardTitle, isDay && S.isoCardTitleDay]}>ISO 9001:2015</Text>
                    <View style={[S.isoVerifiedPill, { backgroundColor: isDay ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.2)' }]}>
                      <Text style={[S.isoVerifiedPillText, { color: isDay ? '#047857' : '#34d399' }]}>Quality Standard</Text>
                    </View>
                  </View>
                  <Text style={[S.isoCardScope, isDay && S.isoCardScopeDay]}>
                    Quality Management Systems for agricultural technology advisory, soil health mapping, and farm workflow optimization.
                  </Text>
                </View>
              </View>

              {/* Card 2: ISO 27001 */}
              <View style={[S.isoCard, isDay ? S.isoCardDay : S.isoCardNight, isMobile && S.isoCardMobile]}>
                <View style={[S.isoIconWrapper, { backgroundColor: isDay ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.18)' }]}>
                  <Ionicons name="lock-closed" size={24} color={isDay ? '#2563eb' : '#60a5fa'} />
                </View>
                <View style={S.isoCardContent}>
                  <View style={S.isoCardTitleRow}>
                    <Text style={[S.isoCardTitle, isDay && S.isoCardTitleDay]}>ISO 27001 Aligned</Text>
                    <View style={[S.isoVerifiedPill, { backgroundColor: isDay ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.2)' }]}>
                      <Text style={[S.isoVerifiedPillText, { color: isDay ? '#1d4ed8' : '#60a5fa' }]}>Information Security</Text>
                    </View>
                  </View>
                  <Text style={[S.isoCardScope, isDay && S.isoCardScopeDay]}>
                    Zero data leakage architecture. Encrypted farmer identity KYC, land boundary records, and secure payment processing.
                  </Text>
                </View>
              </View>

              {/* Card 3: ICAR Protocol Alignment */}
              <View style={[S.isoCard, isDay ? S.isoCardDay : S.isoCardNight, isMobile && S.isoCardMobile]}>
                <View style={[S.isoIconWrapper, { backgroundColor: isDay ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.18)' }]}>
                  <Ionicons name="leaf" size={24} color={isDay ? '#047857' : '#10b981'} />
                </View>
                <View style={S.isoCardContent}>
                  <View style={S.isoCardTitleRow}>
                    <Text style={[S.isoCardTitle, isDay && S.isoCardTitleDay]}>ICAR Agronomy Protocols</Text>
                    <View style={[S.isoVerifiedPill, { backgroundColor: isDay ? 'rgba(5,150,105,0.12)' : 'rgba(5,150,105,0.2)' }]}>
                      <Text style={[S.isoVerifiedPillText, { color: isDay ? '#047857' : '#10b981' }]}>Agronomy Validated</Text>
                    </View>
                  </View>
                  <Text style={[S.isoCardScope, isDay && S.isoCardScopeDay]}>
                    AI diagnosis thresholds and recommended bio-inputs rigorously benchmarked against Indian Council of Agricultural Research guidelines.
                  </Text>
                </View>
              </View>

              {/* Card 4: MCA Registered Entity */}
              <View style={[S.isoCard, isDay ? S.isoCardDay : S.isoCardNight, isMobile && S.isoCardMobile]}>
                <View style={[S.isoIconWrapper, { backgroundColor: isDay ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.18)' }]}>
                  <Ionicons name="business" size={24} color={isDay ? '#b45309' : '#fbbf24'} />
                </View>
                <View style={S.isoCardContent}>
                  <View style={S.isoCardTitleRow}>
                    <Text style={[S.isoCardTitle, isDay && S.isoCardTitleDay]}>MCA Registered Entity</Text>
                    <View style={[S.isoVerifiedPill, { backgroundColor: isDay ? 'rgba(217,119,6,0.12)' : 'rgba(217,119,6,0.2)' }]}>
                      <Text style={[S.isoVerifiedPillText, { color: isDay ? '#b45309' : '#fbbf24' }]}>Govt. of India</Text>
                    </View>
                  </View>
                  <Text style={[S.isoCardScope, isDay && S.isoCardScopeDay]}>
                    FARMSKING TECHNOLOGIES PRIVATE LIMITED • CIN: U01100PB2026PTC063294 • Regd. Office: VPO Goindwal Sahib, Punjab - 143422.
                  </Text>
                </View>
              </View>

            </View>

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

          <View style={[S.fourCardsRow, isMobile && S.fourCardsRowMobile]}>
            {/* ══ Card 1: Farming (Exact Original Picture Glass Style) ══ */}
            <SpatialTiltCard
              style={[
                S.pillarCardOrig,
                isTablet && S.pillarCardOrigTablet,
                isMobile && S.pillarCardOrigMobile,
                isDay ? S.pillarCardOrigDay : null,
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day card-farming-day' : 'orig-glass-card card-farming' } as any) : {},
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
                <Ionicons name="scan-circle" size={11} color={isDay ? '#d97706' : '#fbbf24'} />
                <Text style={[S.pillarMicroBadgeText, isDay ? S.pillarMicroBadgeTextFarmingDay : S.pillarMicroBadgeTextFarmingNight]}>
                  AI Crop Doctor &amp; Mandi
                </Text>
              </View>

              <Text style={[S.origCardSubtitle, isDay && S.origCardSubtitleDay]}>
                Precision Agriculture, Yield Max, Resource Efficiency.
              </Text>
              <View style={S.pillarFeatureList}>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#d97706' : '#fbbf24'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>Daily APMC Mandi price discovery</Text>
                </View>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#d97706' : '#fbbf24'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>GPS boundary & soil canopy tracking</Text>
                </View>
              </View>

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
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day card-gardening-day' : 'orig-glass-card card-gardening' } as any) : {},
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
              <View style={S.pillarFeatureList}>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#db2777' : '#f472b6'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>Smart sunlight & watering schedules</Text>
                </View>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#db2777' : '#f472b6'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>Organic seed kits & bio-nutrition</Text>
                </View>
              </View>

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
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day card-cropdoctors-day' : 'orig-glass-card card-cropdoctors' } as any) : {},
              ]}
              glowColor={isDay ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.45)'}
              tiltMax={7}
              onPress={() => router.push('/topic/Crop-Doctors')}
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
              <View style={S.pillarFeatureList}>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>100,000+ field pathology models</Text>
                </View>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>Certified bio-chemical dosages</Text>
                </View>
              </View>

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
                Platform.OS === 'web' ? ({ className: isDay ? 'orig-glass-card-day card-agristore-day' : 'orig-glass-card card-agristore' } as any) : {},
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
              <View style={S.pillarFeatureList}>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#0284c7' : '#38bdf8'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>100% genuine lab-verified inputs</Text>
                </View>
                <View style={S.pillarFeatureItem}>
                  <Ionicons name="checkmark-circle" size={12} color={isDay ? '#0284c7' : '#38bdf8'} />
                  <Text style={[S.pillarFeatureText, isDay && S.pillarFeatureTextDay]}>Transparent farmgate direct delivery</Text>
                </View>
              </View>

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

        
                {/* ══ FARM-DIRECT NATURAL & ORGANIC FOOD PAVILION ══ */}
        <View style={[S.organicSection, isDay ? S.organicSectionDay : null, isMobile && S.organicSectionMobile]}>
          <View style={S.sectionHeader}>
            <View style={[S.sectionBadgeRow, isDay && S.sectionBadgeRowDay]}>
              <View style={[S.sectionBadgeDot, isDay && S.sectionBadgeDotDay, { backgroundColor: '#10b981' }]} />
              <Text style={[S.sectionEyebrow, isDay && S.sectionEyebrowDay, { color: isDay ? '#047857' : '#34d399' }]}>
                100% CHEMICAL-FREE & ARTISANAL
              </Text>
            </View>
            <Text style={[S.sectionHeadline, isDay && S.sectionHeadlineDay, isMobile && S.sectionHeadlineMobile]}>
              Natural Farmer-Made Food Pavilion
            </Text>
            <Text style={[S.sectionSubhead, isDay && S.sectionSubheadDay, isMobile && S.sectionSubheadMobile]}>
              Authentic organic staples handcrafted by verified Indian cultivators. Zero chemical adulteration, zero industrial bleaching, and 100% fair direct farm earnings.
            </Text>
          </View>

          {/* Trust Guarantees Bar */}
          <View style={[S.organicTrustRow, isMobile && S.organicTrustRowMobile]}>
            <View style={[S.organicTrustItem, isDay ? S.organicTrustItemDay : S.organicTrustItemNight]}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={[S.organicTrustText, isDay && S.organicTrustTextDay]}>Zero Chemical Residue</Text>
            </View>
            <View style={[S.organicTrustItem, isDay ? S.organicTrustItemDay : S.organicTrustItemNight]}>
              <Ionicons name="git-commit" size={14} color="#0ea5e9" />
              <Text style={[S.organicTrustText, isDay && S.organicTrustTextDay]}>Farm-to-Kitchen Traceability</Text>
            </View>
            <View style={[S.organicTrustItem, isDay ? S.organicTrustItemDay : S.organicTrustItemNight]}>
              <Ionicons name="sparkles" size={14} color="#f59e0b" />
              <Text style={[S.organicTrustText, isDay && S.organicTrustTextDay]}>Cold & Wood Pressed</Text>
            </View>
            <View style={[S.organicTrustItem, isDay ? S.organicTrustItemDay : S.organicTrustItemNight]}>
              <Ionicons name="heart" size={14} color="#ec4899" />
              <Text style={[S.organicTrustText, isDay && S.organicTrustTextDay]}>100% Cultivator Earnings</Text>
            </View>
          </View>

          {/* Direct Agri Store & Cultivator Listing Banner */}
          
          <View style={[S.organicFarmerBanner, isDay ? S.organicFarmerBannerDay : S.organicFarmerBannerNight, isMobile && S.organicFarmerBannerMobile]}>
            <View style={S.organicFarmerBannerLeft}>
              <View style={S.organicFarmerBannerIconBox}>
                <Ionicons name="leaf" size={22} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.organicFarmerBannerTitle, isDay && S.organicFarmerBannerTitleDay]}>
                  Pure Organic Produce & Farmer-Made Staples
                </Text>
                <Text style={[S.organicFarmerBannerSub, isDay && S.organicFarmerBannerSubDay]}>
                  Browse certified cold-pressed virgin oils, raw honey, unpolished pulses, and heirloom flours directly from verified Indian cultivators, or register to list your own produce.
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={[S.organicFarmerBannerBtn, { backgroundColor: '#10b981' }]}
                onPress={() => router.push('/shop')}
                activeOpacity={0.85}
              >
                <Text style={S.organicFarmerBannerBtnText}>Explore Organic Store →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.organicFarmerBannerBtn, isDay ? S.organicFarmerBannerBtnDay : S.organicFarmerBannerBtnNight]}
                onPress={() => router.push('/seller-dashboard')}
                activeOpacity={0.85}
              >
                <Text style={S.organicFarmerBannerBtnText}>List Your Produce →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ══ DEDICATED PERSONAL AGRONOMIST & GARDEN DOCTOR ALLOCATION ══ */}
        <View style={[S.advisorAllocSection, isDay ? S.advisorAllocSectionDay : null, isMobile && S.advisorAllocSectionMobile]}>
          <View style={S.sectionHeader}>
            <View style={[S.sectionBadgeRow, isDay && S.sectionBadgeRowDay]}>
              <View style={[S.sectionBadgeDot, isDay && S.sectionBadgeDotDay, { backgroundColor: '#06b6d4' }]} />
              <Text style={[S.sectionEyebrow, isDay && S.sectionEyebrowDay, { color: isDay ? '#0891b2' : '#22d3ee' }]}>
                1-ON-1 PERSONAL AGRONOMY CARE
              </Text>
            </View>
            <Text style={[S.sectionHeadline, isDay && S.sectionHeadlineDay, isMobile && S.sectionHeadlineMobile]}>
              Dedicated Agronomist &amp; Garden Doctor Allocation
            </Text>
            <Text style={[S.sectionSubhead, isDay && S.sectionSubheadDay, isMobile && S.sectionSubheadMobile]}>
              Beyond instant AI diagnostics, FarmsKing pairs every registered farmer and urban gardener with an assigned, certified agricultural specialist who provides personal, season-long care.
            </Text>
          </View>

          {/* Allocation Process Trust Ticker */}
          <View style={[S.allocTrustRow, isMobile && S.allocTrustRowMobile]}>
            <View style={[S.allocTrustItem, isDay ? S.allocTrustItemDay : S.allocTrustItemNight]}>
              <Ionicons name="person-circle" size={15} color="#06b6d4" />
              <Text style={[S.allocTrustText, isDay && S.allocTrustTextDay]}>Assigned Human Agronomist</Text>
            </View>
            <View style={[S.allocTrustItem, isDay ? S.allocTrustItemDay : S.allocTrustItemNight]}>
              <Ionicons name="ribbon" size={15} color="#10b981" />
              <Text style={[S.allocTrustText, isDay && S.allocTrustTextDay]}>ICAR &amp; State University Certified</Text>
            </View>
            <View style={[S.allocTrustItem, isDay ? S.allocTrustItemDay : S.allocTrustItemNight]}>
              <Ionicons name="chatbubbles" size={15} color="#8b5cf6" />
              <Text style={[S.allocTrustText, isDay && S.allocTrustTextDay]}>Direct 1-on-1 Call &amp; WhatsApp</Text>
            </View>
            <View style={[S.allocTrustItem, isDay ? S.allocTrustItemDay : S.allocTrustItemNight]}>
              <Ionicons name="checkmark-done-circle" size={15} color="#f59e0b" />
              <Text style={[S.allocTrustText, isDay && S.allocTrustTextDay]}>100% Free for Registered Users</Text>
            </View>
          </View>

          {/* Dual Allocation Showcase Grid: 2 Large Responsive Cards */}
          <View style={[S.allocGrid, isMobile && S.allocGridMobile]}>
            {/* Card 1: Dedicated Farm Agronomist (Crop Doctor for Cultivators) */}
            <SpatialTiltCard
              style={[
                S.allocCard,
                isDay ? S.allocCardDay : S.allocCardNight,
                isMobile && S.allocCardMobile,
                Platform.OS === 'web' ? ({ className: 'alloc-card-hover card-agronomist' } as any) : {},
              ]}
              glowColor={isDay ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.3)'}
              tiltMax={4}
            >
              {/* Header with Icon, Tag and Status */}
              <View style={S.allocCardHeader}>
                <View style={[S.allocIconCircle, { backgroundColor: isDay ? '#ecfeff' : 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4' }]}>
                  <Ionicons name="shield-checkmark" size={26} color="#06b6d4" />
                </View>
                <View style={S.allocCardHeaderMeta}>
                  <View style={[S.allocCardBadge, { backgroundColor: isDay ? '#e0f2fe' : 'rgba(14, 165, 233, 0.15)', borderColor: '#0284c7' }]}>
                    <View style={[S.allocLivePulseDot, { backgroundColor: '#0284c7' }]} />
                    <Text style={[S.allocCardBadgeText, { color: isDay ? '#0369a1' : '#38bdf8' }]}>
                      COMMERCIAL CULTIVATORS &amp; FARMS
                    </Text>
                  </View>
                  <Text style={[S.allocCardTitle, isDay && S.allocCardTitleDay]}>
                    Dedicated Farm Agronomist
                  </Text>
                  <Text style={[S.allocCardSubtitle, isDay && S.allocCardSubtitleDay]}>
                    Personal Crop Doctor Assigned to Your Field
                  </Text>
                </View>
              </View>

              <Text style={[S.allocCardDesc, isDay && S.allocCardDescDay]}>
                When you register your land and crop on FarmsKing, a certified farm agronomist is assigned directly to you. Your personal advisor continuously tracks satellite telemetry, interprets soil lab results, and delivers custom stage-wise spray and nutrition plans.
              </Text>

              {/* 4 Feature Highlights */}
              <View style={[S.allocFeatureGrid, isMobile && S.allocFeatureGridMobile]}>
                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="planet" size={16} color="#06b6d4" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Satellite Telemetry</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    Continuous NDVI crop health and soil moisture telemetry monitored weekly.
                  </Text>
                </View>

                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="flask" size={16} color="#10b981" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Custom Nutrition Plans</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    Precision spray and fertilizer schedules based on soil pH and crop stage.
                  </Text>
                </View>

                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="call" size={16} color="#f59e0b" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Direct 1-on-1 Contact</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    Instant call and WhatsApp desk with your assigned agronomist anytime.
                  </Text>
                </View>

                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="checkmark-done" size={16} color="#3b82f6" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Zero Overdose Guarantee</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    ICAR-aligned bio-solutions that stop unnecessary chemical expenses.
                  </Text>
                </View>
              </View>

              {/* Assigned Specialist Showcase Badge */}
              <View style={[S.allocSpecialistPill, isDay ? S.allocSpecialistPillDay : S.allocSpecialistPillNight]}>
                <View style={[S.allocSpecialistAvatar, { backgroundColor: '#0284c7' }]}>
                  <Text style={S.allocSpecialistAvatarText}>👨‍🌾</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.allocSpecialistName, isDay && S.allocSpecialistNameDay]}>
                    Assigned Certified Agronomist
                  </Text>
                  <Text style={[S.allocSpecialistRole, isDay && S.allocSpecialistRoleDay]}>
                    ICAR / State Agricultural University Certified • Active in Your Region
                  </Text>
                </View>
                <View style={S.allocVerifiedTag}>
                  <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                  <Text style={S.allocVerifiedTagText}>VERIFIED</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[S.allocCardBtn, S.allocCardBtnAgronomist, isDay && S.allocCardBtnAgronomistDay]}
                onPress={() => router.push(user ? '/farmer-profile-setup' : '/topic/Crop-Doctors')}
                activeOpacity={0.85}
              >
                <Text style={S.allocCardBtnText}>Register Land &amp; Get My Crop Doctor →</Text>
              </TouchableOpacity>
            </SpatialTiltCard>

            {/* Card 2: Dedicated Urban Garden Doctor (For Home & Terrace Gardeners) */}
            <SpatialTiltCard
              style={[
                S.allocCard,
                isDay ? S.allocCardDay : S.allocCardNight,
                isMobile && S.allocCardMobile,
                Platform.OS === 'web' ? ({ className: 'alloc-card-hover card-gardener' } as any) : {},
              ]}
              glowColor={isDay ? 'rgba(225, 29, 72, 0.2)' : 'rgba(225, 29, 72, 0.3)'}
              tiltMax={4}
            >
              {/* Header with Icon, Tag and Status */}
              <View style={S.allocCardHeader}>
                <View style={[S.allocIconCircle, { backgroundColor: isDay ? '#fff1f2' : 'rgba(225, 29, 72, 0.15)', borderColor: '#e11d48' }]}>
                  <Ionicons name="leaf" size={26} color="#e11d48" />
                </View>
                <View style={S.allocCardHeaderMeta}>
                  <View style={[S.allocCardBadge, { backgroundColor: isDay ? '#ffe4e6' : 'rgba(225, 29, 72, 0.15)', borderColor: '#e11d48' }]}>
                    <View style={[S.allocLivePulseDot, { backgroundColor: '#e11d48' }]} />
                    <Text style={[S.allocCardBadgeText, { color: isDay ? '#be123c' : '#fb7185' }]}>
                      HOME &amp; TERRACE GARDENERS
                    </Text>
                  </View>
                  <Text style={[S.allocCardTitle, isDay && S.allocCardTitleDay]}>
                    Dedicated Urban Garden Doctor
                  </Text>
                  <Text style={[S.allocCardSubtitle, isDay && S.allocCardSubtitleDay]}>
                    Personal Plant Doctor for Your Terrace &amp; Balcony
                  </Text>
                </View>
              </View>

              <Text style={[S.allocCardDesc, isDay && S.allocCardDescDay]}>
                Grow thriving balcony plants, lush terrace flowerbeds, and clean organic vegetables with dedicated support from an assigned urban horticulturist. Get customized potting soil recipes, sunlight placement guidance, and organic pest cures.
              </Text>

              {/* 4 Feature Highlights */}
              <View style={[S.allocFeatureGrid, isMobile && S.allocFeatureGridMobile]}>
                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="layers" size={16} color="#e11d48" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Potting Soil Recipes</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    Balanced cocopeat, vermicompost, and neem cake mix tailored to each plant.
                  </Text>
                </View>

                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="sunny" size={16} color="#f59e0b" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Sunlight Orientation</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    Optimal light orientation and watering frequency for balconies and terraces.
                  </Text>
                </View>

                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="heart-circle" size={16} color="#10b981" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Pet &amp; Child Safe Bio-Cures</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    100% non-toxic herbal sprays, organic tonics, and natural pest repellents.
                  </Text>
                </View>

                <View style={[S.allocFeatureBox, isDay ? S.allocFeatureBoxDay : S.allocFeatureBoxNight, isMobile && S.allocFeatureBoxMobile]}>
                  <View style={S.allocFeatureIconRow}>
                    <Ionicons name="camera" size={16} color="#8b5cf6" />
                    <Text style={[S.allocFeatureTitle, isDay && S.allocFeatureTitleDay]}>Instant Leaf Photo Reviews</Text>
                  </View>
                  <Text style={[S.allocFeatureDesc, isDay && S.allocFeatureDescDay]}>
                    Snap photos of yellowing leaves or dropping buds for instant expert advice.
                  </Text>
                </View>
              </View>

              {/* Assigned Specialist Showcase Badge */}
              <View style={[S.allocSpecialistPill, isDay ? S.allocSpecialistPillDay : S.allocSpecialistPillNight]}>
                <View style={[S.allocSpecialistAvatar, { backgroundColor: '#e11d48' }]}>
                  <Text style={S.allocSpecialistAvatarText}>🪴</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.allocSpecialistName, isDay && S.allocSpecialistNameDay]}>
                    Assigned Urban Garden Doctor
                  </Text>
                  <Text style={[S.allocSpecialistRole, isDay && S.allocSpecialistRoleDay]}>
                    Urban Horticulture &amp; Botany Specialist • Available for 1-on-1 Guidance
                  </Text>
                </View>
                <View style={S.allocVerifiedTag}>
                  <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                  <Text style={S.allocVerifiedTagText}>VERIFIED</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[S.allocCardBtn, S.allocCardBtnGardener, isDay && S.allocCardBtnGardenerDay]}
                onPress={() => router.push('/topic/Gardening')}
                activeOpacity={0.85}
              >
                <Text style={S.allocCardBtnText}>Connect with a Garden Doctor →</Text>
              </TouchableOpacity>
            </SpatialTiltCard>
          </View>
        </View>

{/* ══ AI_CROP_DOCTOR_LIVE_DEMO: INTERACTIVE AI PATHOLOGY SCANNER ══ */}
        <View style={[S.aiDemoSection, isMobile && S.aiDemoSectionMobile]}>
          <View style={S.sectionHeader}>
            <View style={[S.sectionBadgeRow, isDay && S.sectionBadgeRowDay]}>
              <View style={[S.sectionBadgeDot, isDay && S.sectionBadgeDotDay]} />
              <Text style={[S.sectionEyebrow, isDay && S.sectionEyebrowDay]}>NEURAL PLANT PATHOLOGY</Text>
            </View>
            <Text style={[S.sectionHeadline, isDay && S.sectionHeadlineDay, isMobile && S.sectionHeadlineMobile]}>
              Experience AI Crop Doctor in Action
            </Text>
            <Text style={[S.sectionSubhead, isDay && S.sectionSubheadDay, isMobile && S.sectionSubheadMobile]}>
              FarmsKing multimodal neural scanner detects foliar pathogens, tissue blight, and nutrient deficiencies in 0.8 seconds with 98%+ precision. Sign in free to scan your own crop leaves.
            </Text>
          </View>

          {/* Interactive 2-Column AI Pathology Showcase Box */}
          {(() => {
            const activeData = AI_DEMO_DATA[selectedDemoCrop];
            return (
              <View style={[S.aiDemoDisplayCard, isDay && S.aiDemoDisplayCardDay, isMobile && S.aiDemoDisplayCardMobile]}>
                {/* Left Column: Live AI Viewfinder HUD */}
                <View style={[S.aiDemoViewfinder, isMobile && S.aiDemoViewfinderMobile]}>
                  <View style={[S.aiDemoScreenGlow, { backgroundColor: activeData.leafBg }]} />
                  
                  {/* Top HUD Telemetry */}
                  <View style={S.aiDemoHudHeader}>
                    <View style={S.aiDemoLiveIndicator}>
                      <View style={S.aiDemoLivePulse} />
                      <Text style={S.aiDemoHudTitle}>NEURAL SCAN • 0.8s LATENCY</Text>
                    </View>
                    <View style={S.aiDemoHudConfidence}>
                      <Ionicons name="sparkles" size={12} color="#10b981" />
                      <Text style={S.aiDemoHudConfidenceText}>{activeData.confidence}</Text>
                    </View>
                  </View>

                  {/* Leaf Focus Area with Dynamic Laser Sweep & Targets */}
                  <View style={S.aiDemoLeafContainer}>
                    <Text style={{ fontSize: 72 }}>{activeData.icon}</Text>

                    {/* Cyber Laser Scanner Sweep */}
                    {Platform.OS === 'web' && (
                      <div
                        className="cyber-laser-beam"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent, #10b981, #38bdf8, transparent)',
                          boxShadow: '0 0 14px #10b981',
                        }}
                      />
                    )}

                    {/* Reticle Target 1 */}
                    <View style={[S.aiDemoTargetPin, { top: '25%', left: '20%' }]}>
                      <View style={S.aiDemoTargetBox} />
                      <Text style={S.aiDemoTargetLabel}>Foliar Stress Zone</Text>
                    </View>

                    {/* Reticle Target 2 */}
                    <View style={[S.aiDemoTargetPin, { bottom: '28%', right: '18%' }]}>
                      <View style={[S.aiDemoTargetBox, { borderColor: '#f59e0b' }]} />
                      <Text style={[S.aiDemoTargetLabel, { color: '#f59e0b' }]}>Pathogen Match</Text>
                    </View>
                  </View>

                  {/* Bottom Viewfinder Telemetry Strip */}
                  <View style={S.aiDemoHudFooter}>
                    <Text style={S.aiDemoHudFooterText}>Sensor: Optical + Multispectral</Text>
                    <Text style={[S.aiDemoHudFooterText, { color: '#10b981' }]}>Status: Analyzed</Text>
                  </View>
                </View>

                {/* Right Column: Instant Diagnostic Clinical Report */}
                <View style={[S.aiDemoReport, isMobile && S.aiDemoReportMobile]}>
                  <View style={[S.aiDemoReportHeader, isMobile && S.aiDemoReportHeaderMobile]}>
                    <View style={S.aiDemoCropMeta}>
                      <Text style={[S.aiDemoCropTitle, isDay && S.aiDemoCropTitleDay, isMobile && S.aiDemoCropTitleMobile]}>{activeData.crop}</Text>
                      <View style={S.aiDemoSeverityBadge}>
                        <View style={[S.aiDemoSeverityDot, { backgroundColor: activeData.statusColor }]} />
                        <Text style={S.aiDemoSeverityText}>{activeData.severity}</Text>
                      </View>
                    </View>
                    <View style={S.aiDemoAccuracyPill}>
                      <Text style={S.aiDemoAccuracyText}>{activeData.confidence} Precision</Text>
                    </View>
                  </View>

                  {/* Disease Diagnostic */}
                  <View style={[S.aiDemoFieldBox, isDay && S.aiDemoFieldBoxDay]}>
                    <Text style={S.aiDemoFieldLabel}>DIAGNOSED PATHOLOGY</Text>
                    <Text style={[S.aiDemoFieldValue, { color: isDay ? '#b91c1c' : '#f87171' }]}>
                      {activeData.disease}
                    </Text>
                  </View>

                  {/* Certified Treatment Protocol */}
                  <View style={[S.aiDemoFieldBox, isDay && S.aiDemoFieldBoxDay]}>
                    <Text style={S.aiDemoFieldLabel}>CERTIFIED BIO-ORGANIC PRESCRIPTION</Text>
                    <Text style={[S.aiDemoFieldValue, isDay && { color: '#0f172a' }]}>
                      {activeData.remedy}
                    </Text>
                  </View>

                  {/* Economic Yield & Mandi Benchmark */}
                  <View style={[S.aiDemoStatsGrid, isMobile && S.aiDemoStatsGridMobile]}>
                    <View style={[S.aiDemoMiniStat, isDay && S.aiDemoMiniStatDay]}>
                      <Text style={S.aiDemoMiniStatLabel}>Estimated Recovery</Text>
                      <Text style={[S.aiDemoMiniStatVal, { color: '#10b981' }]}>{activeData.yieldImpact}</Text>
                    </View>
                    <View style={[S.aiDemoMiniStat, isDay && S.aiDemoMiniStatDay]}>
                      <Text style={S.aiDemoMiniStatLabel}>APMC Market Benchmark</Text>
                      <Text style={[S.aiDemoMiniStatVal, { color: isDay ? '#0369a1' : '#38bdf8' }]}>{activeData.mandiPrice}</Text>
                    </View>
                  </View>

                  {/* Action Button: Sign Up / Sign In to use Free Leaf Scanner */}
                  <TouchableOpacity
                    style={[S.aiDemoActionBtn, isDay && S.aiDemoActionBtnDay, isMobile && S.aiDemoActionBtnMobile]}
                    onPress={() => {
                      if (user) {
                        router.push('/crop-disease-scanner');
                      } else {
                        router.push('/login');
                      }
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name={user ? "scan-circle" : "log-in-outline"} size={19} color="#ffffff" />
                    <Text style={S.aiDemoActionBtnText}>
                      {user ? 'Open AI Leaf Doctor & Scan Leaf →' : 'Sign Up / Sign In to Use Free Leaf Scanner →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
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
            {displayedStories.map((story) => (
              <View
                key={story.id}
                style={[
                  S.testimonialCard,
                  isTablet && S.testimonialCardTablet,
                  isMobile && S.testimonialCardMobile,
                  isDay && S.testimonialCardDay,
                ]}
              >
                <View style={S.testiStarsRow}>
                  <View style={S.testiStarsGroup}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={14} color="#f59e0b" />
                    ))}
                  </View>
                  <View style={[S.testiMetricBadge, { backgroundColor: `${story.metricColor}22` }]}>
                    <Text style={[S.testiMetricText, { color: story.metricColor }]}>{story.metric}</Text>
                  </View>
                </View>
                <Text style={[S.testiQuote, isDay && S.testiQuoteDay]}>
                  "{story.quote}"
                </Text>
                <View style={S.testiAuthorRow}>
                  <View style={S.testiAvatarWrapper}>
                    {story.avatarUrl && story.avatarUrl.trim().length > 0 ? (
                      <Image
                        source={{ uri: story.avatarUrl }}
                        style={S.testiAvatarImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[S.testiAvatarBlank, isDay && S.testiAvatarBlankDay]}>
                        <Ionicons name="person" size={20} color={isDay ? '#94a3b8' : '#64748b'} />
                      </View>
                    )}
                    <View style={S.testiVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                    </View>
                  </View>
                  <View style={S.testiAuthorInfo}>
                    <Text style={[S.testiAuthorName, isDay && S.testiAuthorNameDay]} numberOfLines={1}>
                      {story.name}
                    </Text>
                    <Text style={S.testiAuthorLocation} numberOfLines={1}>
                      {story.location}
                    </Text>
                    <Text style={S.testiAuthorCropRole} numberOfLines={1}>
                      {story.cropRole}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Show More / Show Less Toggle Button */}
          {realCultivatorStories.length > 3 && (
            <View style={S.testiShowMoreContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAllStories((prev) => !prev)}
                style={[S.testiShowMoreBtn, isDay && S.testiShowMoreBtnDay]}
              >
                <View style={[S.testiShowMoreBadge, isDay && S.testiShowMoreBadgeDay]}>
                  <Ionicons
                    name={showAllStories ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={isDay ? '#047857' : '#34d399'}
                  />
                </View>
                <Text style={[S.testiShowMoreBtnText, isDay && S.testiShowMoreBtnTextDay]}>
                  {showAllStories
                    ? 'Show Fewer Stories ▴'
                    : `Show More Verified Cultivator Stories (${realCultivatorStories.length - 3} More) ▾`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ══ HOW TO LOG IN & ACCESS YOUR FARMSKING ACCOUNT ══ */}
        <View style={[S.loginGuideSection, isDay ? S.loginGuideSectionDay : null, isMobile && S.loginGuideSectionMobile]}>
          <View style={S.sectionHeader}>
            <View style={[S.sectionBadgeRow, isDay && S.sectionBadgeRowDay]}>
              <View style={[S.sectionBadgeDot, isDay && S.sectionBadgeDotDay, { backgroundColor: '#10b981' }]} />
              <Text style={[S.sectionEyebrow, isDay && S.sectionEyebrowDay, { color: isDay ? '#047857' : '#34d399' }]}>
                INSTANT 10-SECOND ACCESS • ZERO PASSWORD HASSLE
              </Text>
            </View>
            <Text style={[S.sectionHeadline, isDay && S.sectionHeadlineDay, isMobile && S.sectionHeadlineMobile]}>
              How to Log In & Access Your Account
            </Text>
            <Text style={[S.sectionSubhead, isDay && S.sectionSubheadDay, isMobile && S.sectionSubheadMobile]}>
              FarmsKing uses instant mobile OTP verification. No long forms or complicated passwords — simply enter your 10-digit phone number to securely access your personal dashboard.
            </Text>
          </View>

          {/* 3-Step Visual Process (Desktop 3 Columns, Mobile Stacked) */}
          <View style={[S.loginStepsGrid, isMobile && S.loginStepsGridMobile]}>
            {/* Step 1 */}
            <View style={[S.loginStepCard, isDay ? S.loginStepCardDay : S.loginStepCardNight]}>
              <View style={[S.loginStepNumBadge, { backgroundColor: isDay ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }]}>
                <Ionicons name="phone-portrait" size={22} color="#10b981" />
              </View>
              <View style={S.loginStepIndexPill}>
                <Text style={S.loginStepIndexText}>STEP 1</Text>
              </View>
              <Text style={[S.loginStepTitle, isDay && S.loginStepTitleDay]}>
                Enter 10-Digit Mobile
              </Text>
              <Text style={[S.loginStepDesc, isDay && S.loginStepDescDay]}>
                Type your active Indian mobile number. Both existing users and new farmers use the same single screen.
              </Text>
            </View>

            {/* Step 2 */}
            <View style={[S.loginStepCard, isDay ? S.loginStepCardDay : S.loginStepCardNight]}>
              <View style={[S.loginStepNumBadge, { backgroundColor: isDay ? '#ecfeff' : 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4' }]}>
                <Ionicons name="keypad" size={22} color="#06b6d4" />
              </View>
              <View style={[S.loginStepIndexPill, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                <Text style={[S.loginStepIndexText, { color: '#06b6d4' }]}>STEP 2</Text>
              </View>
              <Text style={[S.loginStepTitle, isDay && S.loginStepTitleDay]}>
                Receive Instant SMS OTP
              </Text>
              <Text style={[S.loginStepDesc, isDay && S.loginStepDescDay]}>
                A secure 4-digit one-time passcode arrives on your phone within seconds. Zero passwords to remember or reset.
              </Text>
            </View>

            {/* Step 3 */}
            <View style={[S.loginStepCard, isDay ? S.loginStepCardDay : S.loginStepCardNight]}>
              <View style={[S.loginStepNumBadge, { backgroundColor: isDay ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }]}>
                <Ionicons name="speedometer" size={22} color="#f59e0b" />
              </View>
              <View style={[S.loginStepIndexPill, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Text style={[S.loginStepIndexText, { color: '#f59e0b' }]}>STEP 3</Text>
              </View>
              <Text style={[S.loginStepTitle, isDay && S.loginStepTitleDay]}>
                Open Your Custom Portal
              </Text>
              <Text style={[S.loginStepDesc, isDay && S.loginStepDescDay]}>
                Instantly enter your tailored workspace — with your land telemetry, assigned crop doctor, or store payouts ready.
              </Text>
            </View>
          </View>

          {/* 4 Roles Card Container */}
          <View style={[S.loginRolesContainer, isDay ? S.loginRolesContainerDay : S.loginRolesContainerNight, isMobile && S.loginRolesContainerMobile]}>
            <View style={S.loginRolesHeader}>
              <Ionicons name="people" size={18} color="#10b981" />
              <Text style={[S.loginRolesHeading, isDay && S.loginRolesHeadingDay]}>
                Who Can Log In & What You Access:
              </Text>
            </View>

            <View style={[S.loginRolesGrid, isMobile && S.loginRolesGridMobile]}>
              {/* Role 1: Farmers */}
              <View style={[S.loginRoleItem, isDay ? S.loginRoleItemDay : S.loginRoleItemNight, isMobile && S.loginRoleItemMobile]}>
                <Text style={S.loginRoleEmoji}>👨‍🌾</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[S.loginRoleTitle, isDay && S.loginRoleTitleDay]}>Farmers & Cultivators</Text>
                  <Text style={[S.loginRoleDesc, isDay && S.loginRoleDescDay]}>
                    Access farm passbook, satellite field telemetry, crop spray schedules & your assigned personal agronomist.
                  </Text>
                </View>
              </View>

              {/* Role 2: Gardeners */}
              <View style={[S.loginRoleItem, isDay ? S.loginRoleItemDay : S.loginRoleItemNight, isMobile && S.loginRoleItemMobile]}>
                <Text style={S.loginRoleEmoji}>🪴</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[S.loginRoleTitle, isDay && S.loginRoleTitleDay]}>Home & Terrace Gardeners</Text>
                  <Text style={[S.loginRoleDesc, isDay && S.loginRoleDescDay]}>
                    Get plant clinic reviews, potting soil recipes & 1-on-1 urban garden doctor assistance.
                  </Text>
                </View>
              </View>

              {/* Role 3: Crop Doctors & Advisors */}
              <View style={[S.loginRoleItem, isDay ? S.loginRoleItemDay : S.loginRoleItemNight, isMobile && S.loginRoleItemMobile]}>
                <Text style={S.loginRoleEmoji}>🩺</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[S.loginRoleTitle, isDay && S.loginRoleTitleDay]}>Agronomists & Staff</Text>
                  <Text style={[S.loginRoleDesc, isDay && S.loginRoleDescDay]}>
                    Manage assigned farmer rosters, review crop tickets, prescribe bio-cures & update APMC market rates.
                  </Text>
                </View>
              </View>

              {/* Role 4: Sellers */}
              <View style={[S.loginRoleItem, isDay ? S.loginRoleItemDay : S.loginRoleItemNight, isMobile && S.loginRoleItemMobile]}>
                <Text style={S.loginRoleEmoji}>🏪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[S.loginRoleTitle, isDay && S.loginRoleTitleDay]}>Agri Sellers & Artisans</Text>
                  <Text style={[S.loginRoleDesc, isDay && S.loginRoleDescDay]}>
                    List natural farmer-made foods, certified seeds & manage orders with 0% middleman deduction.
                  </Text>
                </View>
              </View>
            </View>

            {/* Main Action Bar */}
            <View style={[S.loginActionBanner, isDay ? S.loginActionBannerDay : S.loginActionBannerNight]}>
              <View style={{ flex: 1, minWidth: 260 }}>
                <Text style={[S.loginActionBannerTitle, isDay && S.loginActionBannerTitleDay]}>
                  {user ? `Welcome back, ${user.name || user.mobile}!` : 'Ready to access your smart farming portal?'}
                </Text>
                <Text style={[S.loginActionBannerSub, isDay && S.loginActionBannerSubDay]}>
                  {user
                    ? 'You are currently authenticated. Click below to jump straight to your dashboard.'
                    : 'Enter your 10-digit mobile number on the login screen to sign in or create an account in 10 seconds.'}
                </Text>
              </View>

              <TouchableOpacity
                style={[S.loginActionBtn, user && { backgroundColor: '#0284c7' }]}
                onPress={() => {
                  if (user) {
                    router.push('/(user)/(tabs)');
                  } else {
                    router.push('/login');
                  }
                }}
                activeOpacity={0.88}
              >
                <Ionicons name={user ? 'speedometer' : 'log-in'} size={18} color="#ffffff" />
                <Text style={S.loginActionBtnText}>
                  {user ? 'Open My Account Dashboard →' : 'Login with Mobile Number →'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Helpline Support Note */}
            <View style={S.loginHelplineRow}>
              <Ionicons name="help-circle-outline" size={14} color={isDay ? '#64748b' : '#94a3b8'} />
              <Text style={[S.loginHelplineText, isDay && S.loginHelplineTextDay]}>
                Need help signing in? Call our Farmer Desk:{' '}
                <Text
                  style={{ color: isDay ? '#059669' : '#34d399', fontFamily: FONT.bold }}
                  onPress={() => Linking.openURL('tel:9577622000')}
                >
                  95776-22000
                </Text>{' '}
                (Mon – Sat, 10 AM – 5 PM IST)
              </Text>
            </View>
          </View>
        </View>

        {/* ══ COMPREHENSIVE MULTI-COLUMN RESPONSIVE FOOTER ══ */}
        <View style={[S.footer, isDay && S.footerDay]}>
          <View style={S.footerColumnsGrid}>
            {/* Column 1: Brand & Mission */}
            <View style={[S.footerCol, isTablet && S.footerColTablet, isMobile && S.footerColMobile]}>
              <View style={[S.footerBrandRow, { alignSelf: 'flex-start', marginBottom: 12 }]}>
                <BrandLogo height={38} width={128} useHdQuality resizeMode="contain" />
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
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/topic/Farming' } : {})}
                onPress={() => router.push('/topic/Farming')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Precision Farming OS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/topic/Gardening' } : {})}
                onPress={() => router.push('/topic/Gardening')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Urban Gardening Kits</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/ai-doctor' } : {})}
                onPress={() => router.push('/ai-doctor')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>AI Crop Doctor Diagnosis</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/shop' } : {})}
                onPress={() => router.push('/shop')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Certified Agri Store</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/crop-intelligence' } : {})}
                onPress={() => router.push('/crop-intelligence')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Satellite Telemetry</Text>
              </TouchableOpacity>
            </View>

            {/* Column 3: Legal & Regulatory */}
            <View style={[S.footerCol, isTablet && S.footerColTablet, isMobile && S.footerColMobile]}>
              <Text style={[S.footerColTitle, isDay && S.footerColTitleDay]}>Legal & Compliance</Text>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/compliance' } : {})}
                onPress={() => router.push('/compliance' as any)}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay, { color: isDay ? '#059669' : '#34d399', fontFamily: FONT.bold }]}>
                  MCA & Statutory Disclosures
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/privacy-policy' } : {})}
                onPress={() => router.push('/privacy-policy')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Privacy Policy (DPDPA 2023)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/terms' } : {})}
                onPress={() => router.push('/terms' as any)}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/refund-policy' } : {})}
                onPress={() => router.push('/refund-policy' as any)}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Refund & Return Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/contact-us' } : {})}
                onPress={() => router.push('/contact-us')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Grievance & Support Desk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/seller-dashboard' } : {})}
                onPress={() => router.push(user ? '/(partner)/(tabs)' : '/seller-dashboard')}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Agronomist & Seller Portal</Text>
              </TouchableOpacity>
            </View>

            {/* Column 4: Support & Assistance */}
            <View style={[S.footerCol, isTablet && S.footerColTablet, isMobile && S.footerColMobile]}>
              <Text style={[S.footerColTitle, isDay && S.footerColTitleDay]}>Support & Assistance</Text>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/contact-us' } : {})}
                onPress={() => router.push('/contact-us')}
                activeOpacity={0.8}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Farmer Helpline Desk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: '/contact-us' } : {})}
                onPress={() => router.push('/contact-us')}
                activeOpacity={0.8}
              >
                <Text style={[S.footerLink, isDay && S.footerLinkDay]}>Contact Support Team</Text>
              </TouchableOpacity>
              <Text style={[S.helplineSub, isDay && S.helplineSubDay, { marginTop: 4, marginBottom: 8 }]}>
                {t.helplineHours}
              </Text>
              <TouchableOpacity
                accessibilityRole="link"
                {...(Platform.OS === 'web' ? { href: `mailto:${supportContact.supportEmail}` } : {})}
                onPress={() => Linking.openURL(`mailto:${supportContact.supportEmail}`).catch(() => {})}
                activeOpacity={0.8}
              >
                <Text style={[S.footerContactEmail, isDay && S.footerContactEmailDay]}>{supportContact.supportEmail}</Text>
              </TouchableOpacity>
              <Text style={[S.footerContactAddr, isDay && S.footerContactAddrDay]}>Regd: Goindwal Sahib, Tarn Taran • Corp: Makhu, Punjab - 143422</Text>
            </View>
          </View>

          {/* Footer Bottom Bar */}
          <View style={[S.footerBottomRow, isDay && S.footerBottomRowDay]}>
            <View style={{ gap: 4, maxWidth: 640 }}>
              <Text style={[S.footerCopyText, isDay && S.footerCopyTextDay]}>
                © 2026 FARMSKING TECHNOLOGIES PRIVATE LIMITED. All rights reserved.
              </Text>
              <Text style={[S.footerCopyText, isDay && S.footerCopyTextDay, { fontSize: 11 }]}>
                Regd. Office: VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422 • CIN: U01100PB2026PTC063294
              </Text>
              <Text style={[S.footerCopyText, isDay && S.footerCopyTextDay, { fontSize: 11 }]}>
                Platform Technology Partner: <Text style={{ fontFamily: FONT.bold, color: isDay ? '#059669' : '#34d399' }}>Exilent Web Solutions</Text>
              </Text>
            </View>
            <View style={S.securityBadgesRow}>
              <Text style={[S.securityBadgeItem, isDay && { color: '#64748b' }]}>🏛️ MCA Govt. of India</Text>
              <Text style={[S.securityBadgeItem, isDay && { color: '#64748b' }]}>🔒 256-Bit SSL Bank-Grade</Text>
              <Text style={[S.securityBadgeItem, isDay && { color: '#64748b' }]}>🌱 ICAR Aligned</Text>
              <Text style={[S.securityBadgeItem, isDay && { color: '#64748b' }]}>🇮🇳 Made in Punjab, India</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ══ APP-STYLE MOBILE NAVIGATION SHEET / DRAWER ══ */}
      <Modal
        visible={mobileMenuOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setMobileMenuOpen(false)}
      >
        <View style={S.modalOverlayBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMobileMenuOpen(false)}
          />

          <View style={[S.appDrawerContainer, isDay && S.appDrawerContainerDay]}>
            {/* Top Sheet Drag Handle */}
            <View style={[S.sheetHandleBar, isDay && S.sheetHandleBarDay]} />

            {/* Header: Brand & Close Button */}
            <View style={S.drawerHeaderRow}>
              <View style={S.drawerBrandRow}>
                <BrandLogo
                  height={36}
                  width={120}
                  useHdQuality
                  resizeMode="contain"
                />
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
                    if (user) {
                      const isPartner = ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user?.role || '');
                      router.push(isPartner ? '/(partner)/(tabs)' : '/(user)/(tabs)');
                    } else {
                      if (Platform.OS === 'web' && typeof window !== 'undefined') {
                        try {
                          router.push('/(auth)/login' as any);
                        } catch {}
                        setTimeout(() => {
                          if (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/index') {
                            window.location.href = '/login';
                          }
                        }, 60);
                      } else {
                        try {
                          router.push('/(auth)/login' as any);
                        } catch {
                          router.push('/login' as any);
                        }
                      }
                    }
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
                  onPress={() => { setMobileMenuOpen(false); router.push('/ai-doctor'); }}
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
                  onPress={() => {
                    setMobileMenuOpen(false);
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      const el = document.getElementById('mandi-rates');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                        return;
                      }
                    }
                    router.push('/#mandi-rates' as any);
                  }}
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
                <Ionicons name="headset" size={16} color={isDay ? '#047857' : '#34d399'} />
                <Text style={[S.drawerHelplineText, isDay && S.drawerHelplineTextDay]}>
                  {t.farmerHelpline} &amp; Support Desk
                </Text>
              </TouchableOpacity>

              {/* Bottom Big Action Button */}
              <TouchableOpacity
                style={[S.drawerMainActionBtn, isDay && S.drawerMainActionBtnDay]}
                onPress={() => {
                  setMobileMenuOpen(false);
                  if (user) {
                    const isPartner = ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user?.role || '');
                    router.push(isPartner ? '/(partner)/(tabs)' : '/(user)/(tabs)');
                  } else {
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      try {
                        router.push('/(auth)/login' as any);
                      } catch {}
                      setTimeout(() => {
                        if (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/index') {
                          window.location.href = '/login';
                        }
                      }, 60);
                    } else {
                      try {
                        router.push('/(auth)/login' as any);
                      } catch {
                        router.push('/login' as any);
                      }
                    }
                  }
                }}
                activeOpacity={0.88}
              >
                <Ionicons name="rocket-outline" size={18} color="#022c22" />
                <Text style={S.drawerMainActionBtnText}>
                  {user ? 'Open Farmer Dashboard' : 'Login / Enter FarmsKing App'}
                </Text>
              </TouchableOpacity>

              {/* Drawer Statutory Copyright Footer */}
              <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 12, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDay ? '#475569' : '#94a3b8', textAlign: 'center' }}>
                  © 2026 FARMSKING TECHNOLOGIES PRIVATE LIMITED
                </Text>
                <Text style={{ fontSize: 9.5, color: isDay ? '#64748b' : '#64748b', textAlign: 'center', marginTop: 3 }}>
                  All rights reserved • Regd: Goindwal Sahib, Tarn Taran, Punjab
                </Text>
                <Text style={{ fontSize: 10, color: isDay ? '#059669' : '#34d399', textAlign: 'center', marginTop: 3, fontWeight: '700' }}>
                  Developer Company: Exilent Web Solutions
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══ LIVE SOCIAL PROOF ACTIVITY TICKER (FLOATING BOTTOM-LEFT - DESKTOP/TABLET ONLY) ══ */}
      {!tickerDismissed && !isMobile && scrollY > 280 && (
        <Animated.View
          style={[
            S.liveTickerFixedContainer,
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
                {currentActivity.isReal && (
                  <View style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 }}>
                    <Ionicons name="shield-checkmark" size={10} color="#059669" />
                    <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#047857', letterSpacing: 0.3 }}>REAL FARMER</Text>
                  </View>
                )}
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
                <Text style={S.liveTickerTimeText}>{getActivityDisplayTime(currentActivity)}</Text>
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
          const url = `https://wa.me/919577622000?text=${msg}`;
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
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  scrollContainerDesktop: {
    paddingTop: 72,
    paddingBottom: 24,
  },
  scrollContainerMobile: {
    paddingTop: 84,
    paddingBottom: 100,
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
    paddingTop: 4,
    paddingBottom: 10,
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    paddingTop: 32,
    paddingBottom: 44,
  },
  heroMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 4,
  },
  glowOrbBabyMint: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(167, 243, 208, 0.12)',
    top: -90,
    left: -70,
    pointerEvents: 'none' as any,
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
    pointerEvents: 'none' as any,
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
    pointerEvents: 'none' as any,
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
    pointerEvents: 'none' as any,
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
    fontSize: 26,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    lineHeight: 32,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  heroSubTitle: {
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 8,
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
  rollerTrendPillNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
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

  // ══ Executive Live Telemetry Strip ══
  telemetryStripSection: {
    paddingVertical: 24,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  telemetryStripSectionDay: {},
  telemetryStripSectionMobile: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  telemetryStripInner: {
    width: '100%',
  },
  telemetryStripGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    width: '100%',
  },
  telemetryStripGridMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  telemetryMetricCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  telemetryMetricCardDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: '#cbd5e1',
    shadowColor: 'rgba(15, 23, 42, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  telemetryMetricCardNight: {
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  telemetryMetricCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    padding: 14,
    borderRadius: RADIUS.md,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  metricBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.8,
  },
  metricPrimaryValue: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: FONT.extraBold,
    color: '#34d399',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  metricPrimaryValueDay: {
    color: '#059669',
  },
  metricTitle: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  metricTitleDay: {
    color: '#0f172a',
  },
  metricSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 17,
  },
  metricSubtitleDay: {
    color: '#334155',
  },

  // ══ Official Institutional & ISO Compliance Trust Ribbon ══
  isoTrustSection: {
    paddingVertical: 36,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  isoTrustSectionDay: {},
  isoTrustSectionMobile: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  isoTrustInner: {
    width: '100%',
  },
  isoHeaderContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  isoBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    marginBottom: 10,
  },
  isoBadgeChipDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  isoBadgeChipNight: {},
  isoBadgeChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 1.2,
  },
  isoBadgeChipTextDay: {
    color: '#047857',
  },
  isoBadgeChipTextNight: {
    color: '#34d399',
  },
  isoMainHeading: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  isoMainHeadingDay: {
    color: '#0f172a',
  },
  isoSubHeading: {
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 720,
  },
  isoSubHeadingDay: {
    color: '#334155',
  },
  isoGrid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    alignItems: 'stretch',
  },
  isoGridMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  isoCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    flexDirection: 'column',
    gap: 14,
  },
  isoCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: 'rgba(0, 0, 0, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  isoCardDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: '#cbd5e1',
    shadowColor: 'rgba(15, 23, 42, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  isoCardMobile: {
    flex: undefined,
    width: '100%',
    padding: 14,
  },
  isoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isoCardContent: {
    flex: 1,
  },
  isoCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  isoCardTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  isoCardTitleDay: {
    color: '#0f172a',
  },
  isoVerifiedPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
  },
  isoVerifiedPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 0.3,
  },
  isoCardScope: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 18,
  },
  isoCardScopeDay: {
    color: '#334155',
  },

  pillarFeatureList: {
    marginTop: 8,
    marginBottom: 12,
    gap: 4,
    width: '100%',
  },
  pillarFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillarFeatureText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 14,
  },
  pillarFeatureTextDay: {
    color: '#0f172a',
    fontFamily: FONT.semiBold,
  },
  liveBadgeMiniLatency: {
    fontSize: 8.5,
    fontFamily: FONT.semiBold,
    color: '#a7f3d0',
    opacity: 0.85,
  },
  liveBadgeMiniLatencyDay: {
    color: '#047857',
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
    color: '#334155',
  },
  mandiRateHubDay: {
    color: '#1e293b',
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
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
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
    color: '#334155',
  },
  tickerHubDay: {
    color: '#334155',
  },
  tickerPriceDay: {
    color: '#0f172a',
  },
  tickerTimeDay: {
    color: '#475569',
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
    pointerEvents: 'none' as any,
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
    pointerEvents: 'none' as any,
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
    pointerEvents: 'none' as any,
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
    pointerEvents: 'none' as any,
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
    color: '#1e293b',
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
    color: '#334155',
  },
  pillarCardOrigDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
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
    color: '#334155',
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
    borderTopColor: '#cbd5e1',
  },
  footerBrandDay: {
    color: '#0f172a',
  },
  footerCopyDay: {
    color: '#334155',
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
  bottomGliderPill: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  bottomGliderLaser: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 2.5,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
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
  fourCardsRowMobile: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  pillarCardOrigMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    marginBottom: 0,
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testiStarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  testiMetricBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  testiMetricText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  testiQuote: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#e2e8f0',
    lineHeight: 21,
    marginBottom: 16,
    flex: 1,
  },
  testiQuoteDay: {
    color: '#334155',
  },
  testiAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
  },
  testiAvatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  testiAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#0f172a',
  },
  testiAvatarBlank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testiAvatarBlankDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  testiVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testiAuthorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  testiAuthorName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  testiAuthorNameDay: {
    color: '#0f172a',
  },
  testiAuthorLocation: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  testiAuthorCropRole: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#10b981',
    marginTop: 1,
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
  testiShowMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    width: '100%',
  },
  testiShowMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    ...premiumShadow('rgba(16, 185, 129, 0.25)', 'sm'),
  },
  testiShowMoreBtnDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    ...premiumShadow('rgba(16, 185, 129, 0.15)', 'xs'),
  },
  testiShowMoreBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testiShowMoreBadgeDay: {
    backgroundColor: '#d1fae5',
  },
  testiShowMoreBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.2,
  },
  testiShowMoreBtnTextDay: {
    color: '#047857',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DEDICATED APP DOWNLOAD CARD & DYNAMIC QR
  // ══════════════════════════════════════════════════════════════════════════
  appBannerWrapper: {
    paddingVertical: 14,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  appDownloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    ...premiumShadow('rgba(0, 0, 0, 0.35)', 'md'),
  },
  appDownloadCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#a7f3d0',
    ...premiumShadow('rgba(16, 185, 129, 0.12)', 'sm'),
  },
  appDownloadCardMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 16,
  },
  appDownloadLeft: {
    justifyContent: 'center',
  },
  appDownloadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  appDownloadBadgeDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  appDownloadBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.6,
  },
  appDownloadBadgeTextDay: {
    color: '#047857',
  },
  appDownloadHeadline: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  appDownloadHeadlineDay: {
    color: '#0f172a',
  },
  appDownloadSubhead: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginBottom: 14,
    maxWidth: 580,
  },
  appDownloadSubheadDay: {
    color: '#475569',
  },
  appDownloadFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  appFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appFeaturePillDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  appFeaturePillText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#e2e8f0',
  },
  appFeaturePillTextDay: {
    color: '#1e293b',
  },
  appDownloadBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  appDownloadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.pill,
    ...premiumShadow('rgba(16, 185, 129, 0.35)', 'sm'),
  },
  appDownloadPrimaryBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#022c22',
  },
  appDownloadSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9.5,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  appDownloadSecondaryBtnDay: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  appDownloadSecondaryBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  appDownloadSecondaryBtnTextDay: {
    color: '#0f172a',
  },
  appDownloadRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appQrBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appQrBoxDay: {},
  appBannerCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 243, 208, 0.25)',
    paddingVertical: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    ...premiumShadow('#000000', 'md'),
  },
  appBannerCardDay: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
    ...premiumShadow('#0f172a', 'xs'),
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
    color: '#1e293b',
    fontFamily: FONT.semiBold,
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
    color: '#334155',
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
    color: '#334155',
  },
  footerQrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    marginBottom: 10,
    ...premiumShadow('#000000', 'xs'),
  },
  footerQrContainerDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0, 0, 0, 0.05)', 'xs'),
  },
  footerAppDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    ...premiumShadow('rgba(16, 185, 129, 0.3)', 'xs'),
  },
  footerAppDownloadBtnDay: {
    backgroundColor: '#10b981',
  },
  footerAppDownloadBtnText: {
    color: '#022c22',
    fontSize: 11,
    fontFamily: FONT.bold,
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
    marginBottom: 0,
    borderWidth: 1,
    flexWrap: 'nowrap',
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
    bottom: 82,
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
  liveTickerLocationTextDay: { color: '#334155' },
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
  aiDoctorSubheadDay: { color: '#334155' },
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
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
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
  aiDiseaseSublineDay: { color: '#334155' },
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
    borderColor: '#cbd5e1',
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
    flexWrap: 'nowrap',
    gap: 8,
    marginBottom: 6,
  },
  ratingReviewsCount: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
    marginLeft: 3,
  },
  ratingReviewsCountDay: { color: '#334155' },
  ratingReviewsCountNight: { color: '#94a3b8' },
  heroAudioReadoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 0,
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


  // ─── Farm-Direct Natural & Organic Pavilion Styles ───────────────────────────
  organicSection: {
    paddingVertical: 52,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  organicSectionDay: {},
  organicSectionMobile: {
    paddingVertical: 36,
  },
  organicTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  organicTrustRowMobile: {
    gap: 6,
    marginBottom: 24,
  },
  organicTrustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  organicTrustItemNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  organicTrustItemDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0,0,0,0.04)', 'sm'),
  },
  organicTrustText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  organicTrustTextDay: {
    color: '#0f172a',
  },
  organicCard: {
    flex: 1,
    minWidth: 230,
    maxWidth: 270,
    borderRadius: 22,
    borderWidth: 1.2,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  organicCardTablet: {
    minWidth: '46%',
    maxWidth: '48%',
  },
  organicCardMobile: {
    minWidth: '100%',
    maxWidth: '100%',
  },
  organicCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('#000000', 'lg'),
  },
  organicCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0,0,0,0.06)', 'lg'),
  },
  organicIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  organicMicroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 10,
  },
  organicMicroTagText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  organicCardTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 6,
  },
  organicCardTitleDay: {
    color: '#0f172a',
  },
  organicCardDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  organicCardDescDay: {
    color: '#334155',
  },
  organicFeatureList: {
    gap: 6,
    marginBottom: 18,
  },
  organicFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  organicFeatureText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  organicFeatureTextDay: {
    color: '#1e293b',
  },
  organicCardBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 'auto',
  },
  organicCardBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  // Cultivator banner
  organicFarmerBanner: {
    marginTop: 36,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  organicFarmerBannerMobile: {
    padding: 16,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
  },
  organicFarmerBannerNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    ...premiumShadow('#000000', 'md'),
  },
  organicFarmerBannerDay: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    ...premiumShadow('rgba(245, 158, 11, 0.1)', 'md'),
  },
  organicFarmerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  organicFarmerBannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organicFarmerBannerTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 2,
  },
  organicFarmerBannerTitleDay: {
    color: '#92400e',
  },
  organicFarmerBannerSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 17,
  },
  organicFarmerBannerSubDay: {
    color: '#b45309',
  },
  organicFarmerBannerBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  organicFarmerBannerBtnNight: {
    backgroundColor: '#f59e0b',
  },
  organicFarmerBannerBtnDay: {
    backgroundColor: '#d97706',
  },
  organicFarmerBannerBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
  },

  // ─── Dedicated Agronomist & Garden Doctor Allocation Showcase Styles ───────────
  advisorAllocSection: {
    paddingVertical: 56,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  advisorAllocSectionDay: {},
  advisorAllocSectionMobile: {
    paddingVertical: 36,
  },
  allocTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  allocTrustRowMobile: {
    gap: 6,
    marginBottom: 24,
  },
  allocTrustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  allocTrustItemNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  allocTrustItemDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.04)', 'sm'),
  },
  allocTrustText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  allocTrustTextDay: {
    color: '#334155',
  },
  allocGrid: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'stretch',
    justifyContent: 'center',
    width: '100%',
  },
  allocGridMobile: {
    flexDirection: 'column',
    gap: 20,
  },
  allocCard: {
    flex: 1,
    minWidth: 260,
    maxWidth: '100%',
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  allocCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('#000000', 'xl'),
  },
  allocCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0,0,0,0.06)', 'xl'),
  },
  allocCardMobile: {
    minWidth: '100%',
    padding: 20,
  },
  allocCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  allocIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocCardHeaderMeta: {
    flex: 1,
  },
  allocCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 8,
  },
  allocLivePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  allocCardBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  allocCardTitle: {
    fontSize: 21,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    lineHeight: 26,
    marginBottom: 2,
  },
  allocCardTitleDay: {
    color: '#0f172a',
  },
  allocCardSubtitle: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#38bdf8',
  },
  allocCardSubtitleDay: {
    color: '#0284c7',
  },
  allocCardDesc: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 20,
  },
  allocCardDescDay: {
    color: '#334155',
  },
  allocFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  allocFeatureGridMobile: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  allocFeatureBox: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  allocFeatureBoxMobile: {
    flex: 0,
    width: '100%',
    minWidth: '100%',
  },
  allocFeatureBoxNight: {
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  allocFeatureBoxDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  allocFeatureIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  allocFeatureTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  allocFeatureTitleDay: {
    color: '#1e293b',
  },
  allocFeatureDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 15,
  },
  allocFeatureDescDay: {
    color: '#334155',
  },
  allocSpecialistPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 22,
    marginTop: 'auto',
  },
  allocSpecialistPillNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  allocSpecialistPillDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  allocSpecialistAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocSpecialistAvatarText: {
    fontSize: 18,
  },
  allocSpecialistName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  allocSpecialistNameDay: {
    color: '#0f172a',
  },
  allocSpecialistRole: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  allocSpecialistRoleDay: {
    color: '#334155',
  },
  allocVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  allocVerifiedTagText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#34d399',
  },
  allocCardBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocCardBtnAgronomist: {
    backgroundColor: '#0284c7',
    ...premiumShadow('#0284c7', 'md'),
  },
  allocCardBtnAgronomistDay: {
    backgroundColor: '#0284c7',
  },
  allocCardBtnGardener: {
    backgroundColor: '#e11d48',
    ...premiumShadow('#e11d48', 'md'),
  },
  allocCardBtnGardenerDay: {
    backgroundColor: '#e11d48',
  },
  // ─── Quick Hero Login Pill Styles ───────────
  heroLoginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  heroLoginPillNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  heroLoginPillDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  heroLoginPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  heroLoginPillText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  heroLoginPillTextDay: {
    color: '#047857',
  },

  // ─── Login & Account Access Guide Styles ───────────
  loginGuideSection: {
    paddingVertical: 56,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  loginGuideSectionDay: {},
  loginGuideSectionMobile: {
    paddingVertical: 36,
  },
  loginStepsGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 28,
  },
  loginStepsGridMobile: {
    flexDirection: 'column',
    gap: 14,
  },
  loginStepCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 22,
    position: 'relative',
  },
  loginStepCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('#000000', 'lg'),
  },
  loginStepCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0,0,0,0.05)', 'lg'),
  },
  loginStepNumBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginStepIndexPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 8,
  },
  loginStepIndexText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#10b981',
    letterSpacing: 0.5,
  },
  loginStepTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 6,
  },
  loginStepTitleDay: {
    color: '#0f172a',
  },
  loginStepDesc: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 18,
  },
  loginStepDescDay: {
    color: '#334155',
  },
  loginRolesContainer: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 26,
  },
  loginRolesContainerNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('#000000', 'xl'),
  },
  loginRolesContainerDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...premiumShadow('rgba(0,0,0,0.06)', 'xl'),
  },
  loginRolesContainerMobile: {
    padding: 16,
  },
  loginRolesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  loginRolesHeading: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  loginRolesHeadingDay: {
    color: '#0f172a',
  },
  loginRolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 22,
  },
  loginRolesGridMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  loginRoleItem: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  loginRoleItemMobile: {
    flex: 0,
    width: '100%',
    minWidth: '100%',
  },
  loginRoleItemNight: {
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loginRoleItemDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  loginRoleEmoji: {
    fontSize: 22,
  },
  loginRoleTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginBottom: 3,
  },
  loginRoleTitleDay: {
    color: '#0f172a',
  },
  loginRoleDesc: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 16,
  },
  loginRoleDescDay: {
    color: '#334155',
  },
  loginActionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  loginActionBannerNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  loginActionBannerDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  loginActionBannerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 3,
  },
  loginActionBannerTitleDay: {
    color: '#065f46',
  },
  loginActionBannerSub: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#a7f3d0',
  },
  loginActionBannerSubDay: {
    color: '#047857',
  },
  loginActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: RADIUS.pill,
    backgroundColor: '#10b981',
    ...premiumShadow('#10b981', 'md'),
  },
  loginActionBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  loginHelplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  loginHelplineText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  loginHelplineTextDay: {
    color: '#334155',
  },

  allocCardBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.2,
  },

  // ─── Super Premium Interactive AI Demo & App Showcase Styles ───────────────
  aiDemoSection: {
    paddingVertical: 56,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  aiDemoTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  aiDemoTabsRowDay: {},
  aiDemoTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  aiDemoTabBtnDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  aiDemoTabBtnActiveNight: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  aiDemoTabBtnActiveDay: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  aiDemoTabText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  aiDemoTabTextDay: {
    color: '#64748b',
  },
  aiDemoTabTextActive: {
    color: '#10b981',
    fontFamily: FONT.extraBold,
  },
  aiDemoTabActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginLeft: 2,
  },
  aiDemoDisplayCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 28, 42, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
    ...premiumShadow('#000000', 'xl'),
  },
  aiDemoDisplayCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: 'rgba(16, 185, 129, 0.12)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 6,
  },
  aiDemoViewfinder: {
    flex: 5,
    backgroundColor: '#05130b',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 360,
    justifyContent: 'space-between',
  },
  aiDemoScreenGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.22,
  },
  aiDemoHudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  aiDemoLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  aiDemoLivePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  aiDemoHudTitle: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    letterSpacing: 0.8,
  },
  aiDemoHudConfidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  aiDemoHudConfidenceText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#34d399',
  },
  aiDemoLeafContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    position: 'relative',
    zIndex: 10,
  },
  aiDemoTargetPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 15,
  },
  aiDemoTargetBox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  aiDemoTargetLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#34d399',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  aiDemoHudFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
  },
  aiDemoHudFooterText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  aiDemoReport: {
    flex: 6,
    padding: 28,
    justifyContent: 'space-between',
    gap: 14,
  },
  aiDemoReportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiDemoCropMeta: {
    flex: 1,
  },
  aiDemoCropTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 4,
  },
  aiDemoCropTitleDay: {
    color: '#0f172a',
  },
  aiDemoSeverityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiDemoSeverityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  aiDemoSeverityText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  aiDemoAccuracyPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  aiDemoAccuracyText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  aiDemoFieldBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 4,
  },
  aiDemoFieldBoxDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  aiDemoFieldLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.8,
  },
  aiDemoFieldValue: {
    fontSize: 13.5,
    fontFamily: FONT.semiBold,
    color: '#e2e8f0',
    lineHeight: 19,
  },
  aiDemoStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  aiDemoMiniStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiDemoMiniStatDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  aiDemoMiniStatLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  aiDemoMiniStatVal: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    marginTop: 2,
  },
  aiDemoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  aiDemoActionBtnDay: {
    backgroundColor: '#16a34a',
  },
  aiDemoActionBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // App Showcase Section
  appShowcaseSection: {
    paddingVertical: 48,
    paddingHorizontal: '5%',
    maxWidth: 1360,
    alignSelf: 'center',
    width: '100%',
  },
  appShowcaseCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 36,
    ...premiumShadow('#000000', 'xl'),
  },
  appShowcaseCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 5,
  },
  appShowcaseLeftCol: {
    width: '100%',
    maxWidth: 820,
  },
  appShowcaseTitle: {
    fontSize: 32,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: -0.6,
  },
  appShowcaseTitleDay: {
    color: '#0f172a',
  },
  appShowcaseSubtitle: {
    fontSize: 15,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 23,
    marginBottom: 24,
  },
  appShowcaseSubtitleDay: {
    color: '#334155',
  },
  appPerksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  appPerkItem: {
    width: '47%',
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  appPerkIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appPerkTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
    marginBottom: 2,
  },
  appPerkDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#334155',
    lineHeight: 15,
  },
  appDownloadBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  appDownloadPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: RADIUS.pill,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  appDownloadPrimaryBtnDay: {
    backgroundColor: '#0284c7',
  },
  appDownloadBtnSub: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.8,
  },
  appDownloadBtnTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  appRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  appRatingPillDay: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  appRatingText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  sectionHeadlineMobile: {
    fontSize: 22,
    lineHeight: 28,
  },
  sectionSubheadMobile: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  aiDemoSectionMobile: {
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  aiDemoTabsRowMobile: {
    gap: 8,
    marginBottom: 16,
  },
  aiDemoTabBtnMobile: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  aiDemoTabTextMobile: {
    fontSize: 12,
  },
  aiDemoDisplayCardMobile: {
    flexDirection: 'column',
    borderRadius: 18,
  },
  aiDemoViewfinderMobile: {
    flex: 0,
    width: '100%',
    minHeight: 220,
    padding: 14,
  },
  aiDemoReportMobile: {
    flex: 0,
    width: '100%',
    padding: 16,
    gap: 12,
  },
  aiDemoReportHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  aiDemoCropTitleMobile: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiDemoStatsGridMobile: {
    flexDirection: 'column',
    gap: 8,
  },
  aiDemoActionBtnMobile: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  appShowcaseSectionMobile: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  appShowcaseCardMobile: {
    padding: 18,
    borderRadius: 18,
  },
  appShowcaseTitleMobile: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
  },
  appShowcaseSubtitleMobile: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  appPerksGridMobile: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 18,
  },
  appPerkItemMobile: {
    width: '100%',
    minWidth: '100%',
  },
  appDownloadBtnRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  appDownloadPrimaryBtnMobile: {
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  appRatingPillMobile: {
    alignSelf: 'center',
  },


});
