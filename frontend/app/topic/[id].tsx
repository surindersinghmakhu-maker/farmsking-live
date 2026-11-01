import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  Linking,
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
    badge: '🌾 SMART DIGITAL FARMING OS',
    subtitle: 'Comprehensive Agricultural Ecosystem: AI Crop Care, Satellite Telemetry, Live Mandi Rates & Farm Accounting.',
    details:
      'FarmsKing delivers India’s premier digital agriculture platform engineered specifically for progressive cultivators. Powered by multimodal artificial intelligence and space-tech satellite remote sensing, FarmsKing unites instant crop disease diagnostics, daily wholesale APMC mandi rates across 50+ crops, certified input deliveries, and transparent double-entry bahi-khata accounting in one unified portal.',
    features: [
      'Multimodal AI Crop Doctor (<820ms Detection)',
      'Real-Time APMC Mandi Rates (50+ Crops)',
      '6-Constellation Satellite Field Telemetry',
      'Digital Bahi-Khata (Per-Acre Farm Accounting)',
      '100% Genuine Lab-Tested Seeds & Inputs',
      'Live High-Yield Plants & Certified Nursery',
      'Hyperlocal Weather & Reverse Sowing Alerts',
      '1-on-1 Agronomist Consultation & Helpline',
      'Soil Health & Organic Carbon Mapping',
      'Direct Middleman-Free Farmer Trade',
    ],
  },
  farming: {
    color: '#10b981',
    bg: '#f0fdf4',
    lightBg: '#ecfdf5',
    tint: 'rgba(16,185,129,0.08)',
    image: require('@/assets/images/icon_farming_3d_clean.png'),
    badge: '🌾 SMART DIGITAL FARMING OS',
    subtitle: 'Comprehensive Agricultural Ecosystem: AI Crop Care, Satellite Telemetry, Live Mandi Rates & Farm Accounting.',
    details:
      'FarmsKing delivers India’s premier digital agriculture platform engineered specifically for progressive cultivators. Powered by multimodal artificial intelligence and space-tech satellite remote sensing, FarmsKing unites instant crop disease diagnostics, daily wholesale APMC mandi rates across 50+ crops, certified input deliveries, and transparent double-entry bahi-khata accounting in one unified portal.',
    features: [
      'Multimodal AI Crop Doctor (<820ms Detection)',
      'Real-Time APMC Mandi Rates (50+ Crops)',
      '6-Constellation Satellite Field Telemetry',
      'Digital Bahi-Khata (Per-Acre Farm Accounting)',
      '100% Genuine Lab-Tested Seeds & Inputs',
      'Live High-Yield Plants & Certified Nursery',
      'Hyperlocal Weather & Reverse Sowing Alerts',
      '1-on-1 Agronomist Consultation & Helpline',
      'Soil Health & Organic Carbon Mapping',
      'Direct Middleman-Free Farmer Trade',
    ],
  },
  Gardening: {
    color: '#e11d48',
    bg: '#fff1f2',
    lightBg: '#fdf2f8',
    tint: 'rgba(225,29,72,0.08)',
    image: require('@/assets/images/icon_gardening_3d_clean.png'),
    badge: '🌸 URBAN & HOME GARDENING ECOSYSTEM',
    subtitle: 'Doorstep Live Nursery, NASA Air Purifiers, Organic Potting Media, Kitchen Seeds, Drip Kits & AI Garden Doctor.',
    details:
      'FarmsKing Gardening is India’s premier green living and horticultural platform designed for urban terraces, home balconies, and landscape enthusiasts. From transit-protected live plants and certified nursery saplings to enriched organic potting soils, hybrid kitchen vegetable seeds, and automated micro-drip watering solutions, FarmsKing brings complete botanical vitality to your doorstep.',
    features: [
      'Live Plants & Doorstep Nursery Delivery (Transit-Safe Pack)',
      'NASA Certified Indoor Air-Purifying & Balcony Flora',
      'Enriched Organic Potting Soil & 5kg Cocopeat Blocks',
      'Terrace Kitchen Garden & High-Yield Vegetable Seeds',
      'Perennial Flowering Hybrids & Seasonal Flower Bulbs',
      'Sacred Ayurvedic & Medicinal Living Herb Gardens',
      '100% Odorless Pure Vermicompost & Bio-Stimulants',
      'Modular Balcony Drip Irrigation & Vacation Watering Kits',
      'AI Garden Doctor (<820ms Ornamental Leaf Diagnostics)',
      'Ergonomic Bypass Pruners, Heavy-Duty Grow Bags & Sprayers',
    ],
  },
  gardening: {
    color: '#e11d48',
    bg: '#fff1f2',
    lightBg: '#fdf2f8',
    tint: 'rgba(225,29,72,0.08)',
    image: require('@/assets/images/icon_gardening_3d_clean.png'),
    badge: '🌸 URBAN & HOME GARDENING ECOSYSTEM',
    subtitle: 'Doorstep Live Nursery, NASA Air Purifiers, Organic Potting Media, Kitchen Seeds, Drip Kits & AI Garden Doctor.',
    details:
      'FarmsKing Gardening is India’s premier green living and horticultural platform designed for urban terraces, home balconies, and landscape enthusiasts. From transit-protected live plants and certified nursery saplings to enriched organic potting soils, hybrid kitchen vegetable seeds, and automated micro-drip watering solutions, FarmsKing brings complete botanical vitality to your doorstep.',
    features: [
      'Live Plants & Doorstep Nursery Delivery (Transit-Safe Pack)',
      'NASA Certified Indoor Air-Purifying & Balcony Flora',
      'Enriched Organic Potting Soil & 5kg Cocopeat Blocks',
      'Terrace Kitchen Garden & High-Yield Vegetable Seeds',
      'Perennial Flowering Hybrids & Seasonal Flower Bulbs',
      'Sacred Ayurvedic & Medicinal Living Herb Gardens',
      '100% Odorless Pure Vermicompost & Bio-Stimulants',
      'Modular Balcony Drip Irrigation & Vacation Watering Kits',
      'AI Garden Doctor (<820ms Ornamental Leaf Diagnostics)',
      'Ergonomic Bypass Pruners, Heavy-Duty Grow Bags & Sprayers',
    ],
  },
  'Crop-Doctors': {
    color: '#06b6d4',
    bg: '#ecfeff',
    lightBg: '#f0f9ff',
    tint: 'rgba(6,182,212,0.08)',
    image: require('@/assets/images/icon_cropdoctors_3d_clean.png'),
    badge: '🩺 24/7 AI CROP DOCTOR & PATHOLOGY OS',
    subtitle: 'Sub-second AI Plant Diagnostics, Certified Human Agronomists, Digital e-Prescriptions & Guaranteed Authentic Medicines.',
    details:
      'FarmsKing Crop Doctors is India’s premier plant pathology and crop healthcare platform. Combining cutting-edge multimodal AI computer vision (<820ms response time) with on-demand access to certified agricultural scientists, the platform diagnoses 350+ fungal, bacterial, viral, and insect pest diseases across 50+ crops. Farmers receive instant digital e-prescriptions with calibrated chemical dosages per acre and can order 100% genuine lab-tested medicines delivered directly to their fields.',
    features: [
      'Sub-Second Multimodal AI Leaf & Plant Pathology (<820ms)',
      'Digital e-Parchi & Calibrated Per-Acre Dosage Prescriptions',
      'On-Demand Video/Phone Calls with Certified Agronomists',
      '24/7 Emergency Farmer Consultation Helpline (+91 98883 45678)',
      'Preventive Disease & Reverse-Weather Spray Alerts',
      'One-Click Authentic Medicine Ordering (Zero Fake Guarantee)',
      '350+ Diseases Diagnosed across 50+ Commercial Field Crops',
      'Farm Plot Treatment History & Digital Plant Health Passbook',
      'Voice-Guided Multilingual Symptom & Dosage Readouts',
      'Integrated Pest Management (IPM) & Bio-Fungicide Schedules',
    ],
  },
  'Crop Doctors': {
    color: '#06b6d4',
    bg: '#ecfeff',
    lightBg: '#f0f9ff',
    tint: 'rgba(6,182,212,0.08)',
    image: require('@/assets/images/icon_cropdoctors_3d_clean.png'),
    badge: '🩺 24/7 AI CROP DOCTOR & PATHOLOGY OS',
    subtitle: 'Sub-second AI Plant Diagnostics, Certified Human Agronomists, Digital e-Prescriptions & Guaranteed Authentic Medicines.',
    details:
      'FarmsKing Crop Doctors is India’s premier plant pathology and crop healthcare platform. Combining cutting-edge multimodal AI computer vision (<820ms response time) with on-demand access to certified agricultural scientists, the platform diagnoses 350+ fungal, bacterial, viral, and insect pest diseases across 50+ crops. Farmers receive instant digital e-prescriptions with calibrated chemical dosages per acre and can order 100% genuine lab-tested medicines delivered directly to their fields.',
    features: [
      'Sub-Second Multimodal AI Leaf & Plant Pathology (<820ms)',
      'Digital e-Parchi & Calibrated Per-Acre Dosage Prescriptions',
      'On-Demand Video/Phone Calls with Certified Agronomists',
      '24/7 Emergency Farmer Consultation Helpline (+91 98883 45678)',
      'Preventive Disease & Reverse-Weather Spray Alerts',
      'One-Click Authentic Medicine Ordering (Zero Fake Guarantee)',
      '350+ Diseases Diagnosed across 50+ Commercial Field Crops',
      'Farm Plot Treatment History & Digital Plant Health Passbook',
      'Voice-Guided Multilingual Symptom & Dosage Readouts',
      'Integrated Pest Management (IPM) & Bio-Fungicide Schedules',
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

interface FarmingFeatureItem {
  id: string;
  title: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge: string;
  desc: string;
  specs: string[];
  route: string;
  routeLabel: string;
}

interface FarmingLifecycleStage {
  step: string;
  title: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  desc: string;
  specs: string[];
}

const FARMING_LIFECYCLE_STAGES: FarmingLifecycleStage[] = [
  {
    step: '01',
    title: 'Soil Intelligence & Basal Nutrition',
    tag: 'PRE-SOWING FOUNDATION',
    icon: 'earth',
    color: '#10b981',
    desc: 'Scientific soil fertility mapping, comprehensive N-P-K nutrient analysis, organic carbon enhancement, and laser land leveling to prepare an optimal seedbed.',
    specs: [
      'Comprehensive N-P-K soil report interpretation',
      'Organic carbon boosting via green manuring & compost',
      'pH neutralization & micronutrient zinc/sulfur replenishment',
    ],
  },
  {
    step: '02',
    title: 'Certified Sowing & Weather Windows',
    tag: 'SOWING & GERMINATION',
    icon: 'cloud-done',
    color: '#06b6d4',
    desc: '100% lab-tested hybrid seed varieties with verified germination rates, bio-fungicide seed treatment, and reverse weather sowing calculations to avoid unseasonal rainfall.',
    specs: [
      'Optimal sowing temperature calendar per agro-climatic zone',
      'Bio-fungicide seed dressing (Trichoderma & Azotobacter)',
      'Precision seed drill spacing & laser depth calibration',
    ],
  },
  {
    step: '03',
    title: 'Spaceborne Satellite Telemetry',
    tag: 'CANOPY HEALTH',
    icon: 'planet',
    color: '#8b5cf6',
    desc: '6-constellation Sentinel-2 and Landsat multispectral remote sensing measuring NDVI canopy vigor and NDWI sub-surface moisture stress 14 days before visible symptoms.',
    specs: [
      'Sub-surface moisture deficiency zone heatmaps',
      'NDVI vegetative health & nitrogen absorption tracking',
      'Early micro-nutrient chlorosis detection without ground sensors',
    ],
  },
  {
    step: '04',
    title: 'Sub-Second AI Pathology & Dosage',
    tag: 'CROP PROTECTION',
    icon: 'scan',
    color: '#ef4444',
    desc: 'Multimodal AI camera scanner (<820ms response) diagnosing 350+ fungal, viral, and pest diseases with digital e-parchi prescriptions calibrated precisely per acre.',
    specs: [
      'Sub-second multimodal leaf and stem disease diagnostics',
      'Calibrated dilution for 15L knapsack & 200L tractor sprayers',
      'Integrated Pest Management (IPM) & bio-curative schedules',
    ],
  },
  {
    step: '05',
    title: 'Water Management & Tubewell Control',
    tag: 'WATER STEWARDSHIP',
    icon: 'water',
    color: '#0ea5e9',
    desc: 'Evapotranspiration modeling and precision soil moisture tracking that eliminates redundant tubewell irrigation cycles, cutting diesel and electricity expenses.',
    specs: [
      'Laser moisture sensing saving up to 28% canal/tubewell water',
      'Optimal irrigation cycle timing based on real-time soil temp',
      'Groundwater table conservation and root aeration protocols',
    ],
  },
  {
    step: '06',
    title: 'Live APMC Mandi Discovery & Trading',
    tag: 'HARVEST & TRADE',
    icon: 'trending-up',
    color: '#f97316',
    desc: 'Daily wholesale market arrivals, live modal prices across 50+ crops, best-mandi selling recommendations, and direct settlements linking growers with verified buyers.',
    specs: [
      'Real-time price tickers across Khanna, Ludhiana, Karnal mandis',
      'Best Mandi profitability calculator factoring transit costs',
      'Direct buyer linkages and 24-hour transparent settlements',
    ],
  },
];

interface FarmingAgronomicPillar {
  metric: string;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
}

const FARMING_AGRONOMIC_PILLARS: FarmingAgronomicPillar[] = [
  {
    metric: '-35%',
    label: 'Input Cost Reduction',
    color: '#10b981',
    icon: 'trending-down',
    desc: 'Calibrated per-acre dosage prevents chemical waste, saving ₹2,400 to ₹4,800 per acre on redundant fertilizers and pesticides.',
  },
  {
    metric: '+24%',
    label: 'Harvest Yield Increase',
    color: '#06b6d4',
    icon: 'arrow-up-circle',
    desc: 'Early satellite canopy deficiency detection and reverse-sowing weather windows protect yields from catastrophic climate shocks.',
  },
  {
    metric: 'Zero',
    label: 'Middleman Commission',
    color: '#f97316',
    icon: 'shield-checkmark',
    desc: 'Transparent modal price intelligence and direct buyer connectivity ensure cultivators receive 100% of fair wholesale market value.',
  },
  {
    metric: '100%',
    label: 'Lab-Tested Inputs',
    color: '#8b5cf6',
    icon: 'ribbon',
    desc: 'Batch-coded manufacturer inputs, tamper-evident security packaging, and certified bio-stimulants eliminate counterfeit chemical risks.',
  },
];

const FARMING_ALL_FEATURES: FarmingFeatureItem[] = [
  {
    id: 'ai-crop-doctor',
    title: 'AI Crop Doctor & Disease Diagnostics',
    category: 'CROP PROTECTION',
    icon: 'medkit',
    color: '#06b6d4',
    badge: '< 820ms AI Detection',
    desc: 'Instant plant disease identification using state-of-the-art multimodal vision models. Upload a simple smartphone photo of any infected leaf or stem to diagnose fungal, bacterial, or viral attacks immediately.',
    specs: [
      'Sub-second image analysis and disease identification',
      'Precise chemical and organic curative prescriptions',
      'Exact dosage recommendations per acre / liter',
      '24/7 round-the-clock emergency crop rescue advisory',
    ],
    route: '/topic/Crop-Doctors',
    routeLabel: 'Open AI Doctor',
  },
  {
    id: 'mandi-radar',
    title: 'Live APMC Mandi Radar & Price Intelligence',
    category: 'MARKET INTELLIGENCE',
    icon: 'trending-up',
    color: '#eab308',
    badge: '50+ Crops Live',
    desc: 'Real-time commodity ticker aggregating wholesale prices across Khanna, Ludhiana, Amritsar, Karnal, and nationwide APMC mandis to empower farmers in fair price discovery.',
    specs: [
      'Live modal prices, arrivals, and daily price trends',
      'Dynamic Best Mandi to Sell profitability calculation',
      'Arrival volume tracking for Wheat, Basmati, Cotton & more',
      'Direct contact with verified commission agents',
    ],
    route: '/#mandi-rates',
    routeLabel: 'View Mandi Rates',
  },
  {
    id: 'satellite-telemetry',
    title: '6-Constellation Satellite Field Telemetry',
    category: 'PRECISION FARMING',
    icon: 'planet',
    color: '#8b5cf6',
    badge: 'Space-Tech Sensing',
    desc: 'Spaceborne multispectral field telemetry delivering granular crop health indices directly to your phone without requiring costly ground IoT hardware sensors.',
    specs: [
      'NDVI vegetation vigor mapping and canopy density',
      'NDWI moisture index and sub-surface stress alerts',
      'Zone-by-zone fertilization prescription heatmaps',
      'Historical crop performance and yield forecasting',
    ],
    route: '/crop-intelligence',
    routeLabel: 'Explore Satellite View',
  },
  {
    id: 'bahi-khata',
    title: 'Digital Bahi-Khata & Farm Accounting',
    category: 'FARM MANAGEMENT',
    icon: 'calculator',
    color: '#10b981',
    badge: 'Farm Ledger OS',
    desc: 'Complete agricultural ledger and double-entry bookkeeping engineered specifically for Indian farmers to eliminate paper notebooks and calculate true harvest profits.',
    specs: [
      'Per-crop and per-acre expense tracking (seeds, diesel, labor)',
      'Harvest sale records with automatic profit & loss statement',
      'Digital receipt generation and PDF passbook statements',
      'Vendor and buyer payment settlement tracking',
    ],
    route: '/(user)/(tabs)/wallet',
    routeLabel: 'Open Farm Ledger',
  },
  {
    id: 'agri-store',
    title: 'Certified Seeds & Inputs Marketplace',
    category: 'INPUT SUPPLIES',
    icon: 'shield-checkmark',
    color: '#f97316',
    badge: 'Zero Fake Guarantee',
    desc: 'Direct-from-manufacturer marketplace ensuring 100% lab-tested genuine seeds, bio-fertilizers, and crop protection inputs delivered straight to your farm doorstep.',
    specs: [
      'Certified high-yield hybrid seed varieties',
      'Organic bio-fertilizers, neem oils, and soil amendments',
      'Bulk wholesale factory rates with Cash on Delivery (COD)',
      '100% authentic product seal with zero counterfeit risk',
    ],
    route: '/shop',
    routeLabel: 'Browse Agri Store',
  },
  {
    id: 'live-nursery',
    title: 'Live Plants & Certified Nursery Delivery',
    category: 'LIVE HORTICULTURE',
    icon: 'leaf',
    color: '#059669',
    badge: 'Climate-Safe Transit',
    desc: 'First-of-its-kind doorstep delivery of live horticultural saplings, tissue-culture plants, and organic vegetable nursery plugs in protective climate-controlled transit packaging.',
    specs: [
      'High-yield fruit saplings and timber tree varieties',
      'Tissue-culture disease-free banana & papaya plants',
      'Ready-to-transplant vegetable seedlings plugs',
      'Transit damage replacement guarantee',
    ],
    route: '/topic/Gardening',
    routeLabel: 'Explore Live Plants',
  },
  {
    id: 'weather-alerts',
    title: 'Hyperlocal Weather & Reverse Sowing Alerts',
    category: 'AGRO-METEOROLOGY',
    icon: 'cloudy-night',
    color: '#3b82f6',
    badge: 'Village Weather Forecast',
    desc: 'Hyperlocal village-level meteorological forecasting combined with agronomic reverse sowing calculators to optimize planting schedules and protect crops against extreme weather.',
    specs: [
      '7-day hour-by-hour temperature, rain & wind forecasts',
      'Optimal sowing window calculation based on soil temp',
      'Emergency frost, unseasonal rain & heatwave warnings',
      'Pesticide spraying suitability indicator',
    ],
    route: '/#weather-forecast',
    routeLabel: 'Check Weather Radar',
  },
  {
    id: 'agronomist-helpline',
    title: 'Certified Agronomist Advisory & Helpline',
    category: 'EXPERT CONSULTATION',
    icon: 'call',
    color: '#ef4444',
    badge: 'Human Agronomists',
    desc: 'Direct phone and digital consultations with verified agricultural scientists, plant pathologists, and soil experts to provide personalized guidance for complex field challenges.',
    specs: [
      'Dedicated cultivator helpline: +91 98883 45678',
      'Customized seasonal fertilization and irrigation schedules',
      'Integrated Pest Management (IPM) implementation',
      'Field doctor telephone advisory in simple English',
    ],
    route: 'tel:+919888345678',
    routeLabel: 'Call Farmer Helpline',
  },
  {
    id: 'soil-nutrient',
    title: 'Soil Health & Organic Carbon Mapping',
    category: 'SOIL SCIENCE',
    icon: 'flask',
    color: '#d97706',
    badge: 'Soil Restoration',
    desc: 'Data-driven soil fertility analysis that guides cultivators on restoring depleted organic carbon, correcting N-P-K imbalances, and reducing unnecessary chemical input expenses.',
    specs: [
      'Comprehensive N-P-K ratio calculation per crop type',
      'Organic carbon enhancement protocols (compost & green manure)',
      'Bio-fertilizer and micronutrient replenishment guides',
      'Soil test report interpretation and action planning',
    ],
    route: '/topic/Farming',
    routeLabel: 'Learn Soil Protocols',
  },
  {
    id: 'direct-trade',
    title: 'Direct Farmer-to-Trader APMC Marketing',
    category: 'MARKET ACCESS',
    icon: 'people',
    color: '#6366f1',
    badge: 'Middleman-Free',
    desc: 'Digital trading channels linking progressive cultivators directly with verified wholesale purchasers, bulk institutional buyers, and licensed APMC commission agents.',
    specs: [
      'Direct auction listings for harvested crop lots',
      'Transparent commission and toll fee breakdown',
      'APMC e-Gate pass integration and delivery slips',
      'Instant digital payment verification and settlement',
    ],
    route: '/shop',
    routeLabel: 'Explore Trading',
  },
];

interface CropDoctorFeatureItem {
  id: string;
  title: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge: string;
  desc: string;
  specs: string[];
  route: string;
  routeLabel: string;
}

const CROP_DOCTOR_ALL_FEATURES: CropDoctorFeatureItem[] = [
  {
    id: 'ai-vision-scanner',
    title: 'Multimodal AI Leaf & Stem Vision Scanner',
    category: 'INSTANT SCANNER',
    icon: 'scan',
    color: '#06b6d4',
    badge: '< 820ms AI Response',
    desc: 'Cutting-edge artificial intelligence trained on millions of high-resolution crop pathology images. Point your phone camera at any diseased leaf, stem, fruit, or root to diagnose pathogens in under 820 milliseconds with over 98% accuracy.',
    specs: [
      'Detects fungal blights, rusts, smuts, mildews, and leaf spots',
      'Identifies piercing-sucking insect damage (aphids, thrips, whiteflies)',
      'Pinpoints micro-nutrient deficiencies (zinc, boron, iron, nitrogen)',
      'Works offline with edge inference when field network is weak',
    ],
    route: '/#crop-doctor',
    routeLabel: 'Open Camera Scanner',
  },
  {
    id: 'e-prescription',
    title: 'Digital e-Parchi & Dosage Calculator',
    category: 'CLINICAL PRESCRIPTIONS',
    icon: 'document-text',
    color: '#0ea5e9',
    badge: 'Exact Calibrated Dosing',
    desc: 'Eliminate guesswork and dangerous over-spraying. Every diagnosis generates a formal digital e-parchi listing certified active technical ingredients, brand names, and precise per-acre water and chemical dilution ratios.',
    specs: [
      'Calibrated for 15-Liter knapsack tanks and 200-Liter tractor barrels',
      'Lists both chemical cure and bio-organic alternative options',
      'Specifies exact waiting period (pre-harvest interval) before harvest',
      'Downloadable and shareable PDF prescription for local input dealers',
    ],
    route: '/shop',
    routeLabel: 'View Treatment Guide',
  },
  {
    id: 'human-agronomists',
    title: 'Certified Plant Doctors & Senior Agronomists',
    category: 'EXPERT CONSULTATION',
    icon: 'people',
    color: '#10b981',
    badge: 'M.Sc. & Ph.D. Scientists',
    desc: 'For rare, complex, or persistent crop failures, access a national panel of certified agronomists and plant pathologists. Request direct telephone consultations, video examinations, or physical farm inspections.',
    specs: [
      'Verified agricultural graduates and senior research scientists',
      '1-on-1 scheduled audio and video field walkthroughs',
      'Second-opinion case reviews for disputed farm issues',
      'On-demand farm visit bookings for high-density acreages',
    ],
    route: 'tel:+919888345678',
    routeLabel: 'Talk to Plant Doctor',
  },
  {
    id: 'emergency-helpline',
    title: '24/7 Dedicated Farmer Helpline',
    category: 'ROUND-THE-CLOCK SUPPORT',
    icon: 'call',
    color: '#ef4444',
    badge: 'Instant Dial',
    desc: 'A toll-free and direct-dial agricultural emergency lifeline for farmers facing sudden locust swarms, viral epidemics, or unseasonal weather disasters. Our agronomy team is on call 24 hours a day, 7 days a week.',
    specs: [
      'Direct line: +91 98883 45678 for instant agronomic response',
      'Assistance available in plain, easy-to-understand English',
      'Rapid escalation protocol for district-wide pest outbreaks',
      'Immediate referral to genuine local certified input centers',
    ],
    route: 'tel:+919888345678',
    routeLabel: 'Call +91 98883 45678',
  },
  {
    id: 'preventive-weather-radar',
    title: 'Preventive Disease & Weather Spray Alerts',
    category: 'EARLY WARNINGS',
    icon: 'cloud-done',
    color: '#3b82f6',
    badge: 'Preventive Shield',
    desc: 'Prevention is ten times cheaper than cure. The Crop Doctor engine correlates satellite relative humidity, micro-temperature, and rainfall forecasts to predict disease outbreaks 5 to 7 days before visual onset.',
    specs: [
      'Early warnings for Yellow Rust, Late Blight, and Sheath Blight',
      'Safe spraying weather windows (wind speed < 12 km/h, zero rain)',
      'Preventive bio-spray reminders before monsoons and foggy cold snaps',
      'Hyperlocal push notifications tailored to your GPS farm coordinates',
    ],
    route: '/#weather-forecast',
    routeLabel: 'Check Spray Windows',
  },
  {
    id: 'medicine-delivery',
    title: 'Direct Genuine Medicine Delivery (Zero Fake)',
    category: 'CERTIFIED INPUTS',
    icon: 'shield-checkmark',
    color: '#f97316',
    badge: '100% Genuine Lab-Tested',
    desc: 'Indian farmers lose billions every year to duplicate, adulterated, or expired chemicals. With 1-click ordering from the digital prescription, receive sealed, batch-tested medicines directly from verified manufacturers.',
    specs: [
      'Lab-verified batch numbers and tamper-evident security holograms',
      'Transparent wholesale factory pricing without dealer markups',
      'Cash on Delivery (COD) and fast farm doorstep transit',
      'Hassle-free replacement policy if transit seals are broken',
    ],
    route: '/shop',
    routeLabel: 'Order Prescribed Meds',
  },
  {
    id: 'crop-library',
    title: 'National Crop Disease & Pest Diagnostic Library',
    category: 'KNOWLEDGE REPOSITORY',
    icon: 'book',
    color: '#8b5cf6',
    badge: '350+ Pathogens Cataloged',
    desc: 'A vast visual encyclopedia covering 50+ major crops including Wheat, Basmati Rice, Bt Cotton, Mustard, Sugarcane, Potato, Tomato, Chilli, and Citrus. Browse high-resolution symptom galleries and control protocols.',
    specs: [
      'Visual galleries comparing early, intermediate, and severe stages',
      'Biological control strategies utilizing beneficial insects and fungi',
      'Cultural management practices (crop rotation, spacing, drainage)',
      'Resistance management advice to avoid chemical immunity',
    ],
    route: '/topic/Crop-Doctors',
    routeLabel: 'Explore Disease Library',
  },
  {
    id: 'health-passbook',
    title: 'Field Health Passbook & Treatment History',
    category: 'HISTORICAL TRACKING',
    icon: 'file-tray-full',
    color: '#059669',
    badge: 'Permanent Plot Archive',
    desc: 'Every scan, consultation, and chemical treatment is automatically recorded in your field’s digital health log. Track which pesticides were sprayed, measure recovery timelines, and build long-term disease resistance.',
    specs: [
      'Plot-by-plot chemical application timeline and cumulative dosage',
      'Pest recurrence analytics across successive cropping seasons',
      'Exportable farm safety audit report for export certifications',
      'Integrated with Kisan Bahi-Khata for automated expense logging',
    ],
    route: '/(user)/(tabs)/wallet',
    routeLabel: 'Open Health Passbook',
  },
  {
    id: 'ipm-programs',
    title: 'Integrated Pest Management (IPM) & Bio-Care',
    category: 'SUSTAINABLE AGRONOMY',
    icon: 'leaf',
    color: '#16a34a',
    badge: 'Eco-Friendly Farming',
    desc: 'Promoting soil and plant longevity through integrated pest management. Replace toxic chemical drenches with neem oil formulations, pheromone traps, trichoderma bio-fungicides, and beneficial microorganisms.',
    specs: [
      'Zero-residue organic pest management protocols',
      'Pheromone trap installation and sticky trap monitoring schedules',
      'Soil drenching guidelines for root grub and nematode control',
      'Pollinator-safe spraying protocols that protect honeybees and predators',
    ],
    route: '/topic/Crop-Doctors',
    routeLabel: 'Explore IPM Protocols',
  },
  {
    id: 'voice-multilingual',
    title: 'Voice-Guided Diagnostics & Audio Readouts',
    category: 'ACCESSIBLE AI',
    icon: 'mic',
    color: '#d97706',
    badge: 'Voice-First Interface',
    desc: 'Designed for effortless accessibility in the field. Farmers can listen to prescription instructions, dosage warnings, and symptom details read aloud through clear high-definition audio synthesizers.',
    specs: [
      'Spoken audio readouts of diagnosis and safety precautions',
      'Voice search for instant crop disease lookups without typing',
      'Simple, jargon-free terminology designed for practical field application',
      'Hands-free operation while working in muddy or wet field conditions',
    ],
    route: '/#crop-doctor',
    routeLabel: 'Try Voice Assistant',
  },
];

interface GardeningFeatureItem {
  id: string;
  title: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge: string;
  desc: string;
  specs: string[];
  route: string;
  routeLabel: string;
}

const GARDENING_ALL_FEATURES: GardeningFeatureItem[] = [
  {
    id: 'live-plants-nursery',
    title: 'Live Plants & Doorstep Nursery Delivery',
    category: 'LIVE HORTICULTURE',
    icon: 'leaf',
    color: '#e11d48',
    badge: 'Transit-Safe Packaging',
    desc: 'Doorstep delivery of healthy, rooted live ornamental plants, flowering shrubs, and exotic foliage protected in specialized shock-absorbing, climate-aerated transit boxes.',
    specs: [
      '100% root-ball intact delivery guarantee with moist coco-soil',
      'Instant transit dehydration or damage replacement policy',
      'Sourced directly from verified mother nurseries across India',
      'Includes immediate post-unboxing potting and sunlight guide',
    ],
    route: '/shop',
    routeLabel: 'Shop Live Plants',
  },
  {
    id: 'air-purifying-flora',
    title: 'Indoor Air-Purifying & Balcony Flora',
    category: 'URBAN WELLNESS',
    icon: 'heart',
    color: '#10b981',
    badge: 'NASA Clean Air Tested',
    desc: 'Transform living spaces and balconies with natural air-cleaning plants that absorb benzene, formaldehyde, and indoor toxins while enriching ambient oxygen levels.',
    specs: [
      'Curated varieties: Snake Plant, Areca Palm, ZZ Plant, Spider Plant',
      'Low-maintenance indoor plants thriving in shaded apartment lighting',
      'Non-toxic and pet-friendly ornamental plant selections',
      'Designer ceramic, terracotta, and fiber-planter combinations',
    ],
    route: '/shop',
    routeLabel: 'Explore Clean Air Flora',
  },
  {
    id: 'organic-potting-mix',
    title: 'Organic Potting Soils & Cocopeat Blocks',
    category: 'GROWING MEDIA',
    icon: 'earth',
    color: '#d97706',
    badge: 'Aerated Root-Boost Matrix',
    desc: 'Pre-mixed, nutrient-dense organic potting substrates formulated with aged vermicompost, perlite, neem cake, and trichoderma to prevent root rot and maximize aeration.',
    specs: [
      'Premium 5kg washed and buffered cocopeat expansion blocks',
      '4x water retention capacity reducing daily watering chores',
      'Sterilized weed-free and pathogen-free potting soil formulation',
      'Ideal for container gardening, hanging baskets, and grow bags',
    ],
    route: '/shop',
    routeLabel: 'Order Potting Mix',
  },
  {
    id: 'kitchen-garden-seeds',
    title: 'Kitchen Garden & Hybrid Vegetable Seeds',
    category: 'HOME HARVEST',
    icon: 'nutrition',
    color: '#16a34a',
    badge: '90%+ Germination Rate',
    desc: 'Grow your own fresh, organic, chemical-free vegetables on terraces and balconies with certified high-germination seeds packaged in moisture-proof foil pouches.',
    specs: [
      'Year-round varieties: Cherry Tomatoes, Bell Peppers, Spinach, Coriander, Chillies',
      'Compact and bush-type cultivars tailored for pots and small grow bags',
      'Non-GMO, chemically untreated organic heirloom seeds',
      'Seasonal sowing calendar and companion planting recommendations',
    ],
    route: '/shop',
    routeLabel: 'Get Kitchen Seeds',
  },
  {
    id: 'flowering-hybrids',
    title: 'Flowering Varieties & Seasonal Blooms',
    category: 'FLORICULTURE',
    icon: 'flower',
    color: '#ec4899',
    badge: 'Vibrant Year-Round Blooms',
    desc: 'Brighten balconies, courtyards, and window sills with prolific flowering cultivars bred for extended flowering cycles, fragrant blossoms, and vibrant coloration.',
    specs: [
      'Heavy-blooming hybrids: Hybrid Marigold, Miniature Roses, Petunias, Hibiscus',
      'Specialized bloom booster micro-nutrients and organic seaweed extracts',
      'Step-by-step deadheading, sunlight, and pruning guidelines',
      'Seasonal flower bulb collections for autumn and spring plantings',
    ],
    route: '/shop',
    routeLabel: 'Shop Flowering Plants',
  },
  {
    id: 'ayurvedic-herbs',
    title: 'Medicinal & Ayurvedic Herb Garden',
    category: 'HERBAL WELLNESS',
    icon: 'medkit',
    color: '#06b6d4',
    badge: '100% Ayurvedic Heritage',
    desc: 'Establish your own authentic healing apothecary with revered medicinal herbs and culinary greens that flourish effortlessly in kitchen pots and sunny balconies.',
    specs: [
      'Certified varieties: Krishna Tulsi, Rama Tulsi, Ashwagandha, Lemongrass, Mint, Brahmi',
      'Naturally repels mosquitoes and flies while releasing therapeutic aromas',
      'Simple daily watering and organic herbal leaf harvesting guides',
      'Cold-hardy and heat-tolerant perennial botanical varieties',
    ],
    route: '/shop',
    routeLabel: 'Explore Herbal Garden',
  },
  {
    id: 'bio-plant-food',
    title: 'Pure Vermicompost & Organic Bio-Nutrition',
    category: 'ORGANIC NUTRITION',
    icon: 'shield-checkmark',
    color: '#8b5cf6',
    badge: '100% Odorless Organic',
    desc: 'Premium worm-cast vermicompost and fermented bio-stimulants enriched with active soil microbes to promote vigorous foliage, sturdy stems, and lush flower buds.',
    specs: [
      'Odorless, clean, and completely safe for indoor apartments and pets',
      'Neem cake powder to naturally ward off soil fungus, termites, and root grubs',
      'Cold-pressed organic seaweed liquid fertilizer for foliar spray',
      'Slow-release organic granules that feed plants continuously for 60 days',
    ],
    route: '/shop',
    routeLabel: 'Get Organic Plant Food',
  },
  {
    id: 'drip-irrigation-kits',
    title: 'Balcony Drip Irrigation & Vacation Watering',
    category: 'SMART WATERING',
    icon: 'water',
    color: '#0ea5e9',
    badge: 'Vacation-Proof Plant Care',
    desc: 'Never worry about your plants wilting while you are traveling. Modular micro-drip kits, capillary mats, and self-watering pots automate moisture delivery with zero waste.',
    specs: [
      'Complete DIY plug-and-play kits for 10 to 30 pots with flexible tubing',
      'Adjustable 360-degree drip emitters delivering calibrated milliliters per pot',
      'Tap-connected automatic battery timers and gravity-fed drip setups',
      'Saves up to 70% water compared to conventional watering cans',
    ],
    route: '/shop',
    routeLabel: 'Explore Watering Kits',
  },
  {
    id: 'ai-garden-doctor',
    title: 'AI Plant Doctor for Home Gardens',
    category: 'GARDEN HEALTH AI',
    icon: 'scan',
    color: '#f43f5e',
    badge: 'Instant Leaf Diagnosis',
    desc: 'Snap a quick photo of any wilting, spotted, or pest-attacked garden leaf. FarmsKing’s AI diagnostic engine pinpoints the exact garden pest or nutrient deficiency in under 820ms.',
    specs: [
      'Diagnoses mealybugs, spider mites, aphids, powdery mildew, and leaf curl',
      'Recommends safe organic remedies like cold-pressed neem oil and bio-fungicides',
      'Tailored advice for potting soil over-watering and root rot recovery',
      'Direct access to human garden horticulturists via helpline (+91 98883 45678)',
    ],
    route: '/#crop-doctor',
    routeLabel: 'Scan Garden Plant',
  },
  {
    id: 'tools-planters',
    title: 'Ergonomic Garden Tools & Durable Planters',
    category: 'TOOLS & HARDWARE',
    icon: 'construct',
    color: '#64748b',
    badge: 'Commercial Durability',
    desc: 'Professional horticultural tools, heavy-duty UV-stabilized HDPE grow bags, and precision hand sprayers engineered for comfort, durability, and balcony gardening.',
    specs: [
      'Stainless steel bypass pruning shears, transplanters, and hand rakes',
      'High-density breathable geotextile fabric grow bags in multiple sizes',
      'Continuous-mist 2-Liter brass-nozzle pressure compression sprayers',
      'Lightweight, crack-resistant polymer decorative planters and saucers',
    ],
    route: '/shop',
    routeLabel: 'Browse Garden Tools',
  },
];

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

        {/* ── ALL FARMING CONCEPTS & PLATFORM FEATURES (WHEN ID IS FARMING) ── */}
        {(id === 'Farming' || id === 'farming' || !id) && (
          <View style={styles.featuresSection}>
            {/* 1. Agronomic Value Pillars Matrix */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}35` }]}>
                <Ionicons name="shield-checkmark" size={13} color={cfg.color} />
                <Text style={[styles.sectionBadgeText, { color: cfg.color }]}>PROVEN IMPACT METRICS</Text>
              </View>
              <Text style={styles.sectionMainTitle}>Core Farming Agronomic Pillars</Text>
              <Text style={styles.sectionMainSub}>
                How FarmsKing transforms conventional farming economics through input cost reduction, scientific yield growth, and direct market access.
              </Text>
            </View>

            <View style={styles.farmingFeaturesGrid}>
              {FARMING_AGRONOMIC_PILLARS.map((pillar, pIdx) => (
                <View
                  key={pIdx}
                  style={[
                    styles.farmingFeatureCard,
                    { borderColor: `${pillar.color}35`, backgroundColor: '#ffffff' },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={[styles.featureIconContainer, { backgroundColor: `${pillar.color}15`, borderColor: `${pillar.color}35` }]}>
                      <Ionicons name={pillar.icon} size={22} color={pillar.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pillarMetricText, { color: pillar.color }]}>{pillar.metric}</Text>
                      <Text style={styles.farmingCardTitle}>{pillar.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.farmingCardDesc}>{pillar.desc}</Text>
                </View>
              ))}
            </View>

            {/* 2. The 6-Stage Smart Farming Lifecycle */}
            <View style={[styles.sectionHeaderRow, { marginTop: 42 }]}>
              <View style={[styles.sectionBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}35` }]}>
                <Ionicons name="repeat" size={13} color={cfg.color} />
                <Text style={[styles.sectionBadgeText, { color: cfg.color }]}>END-TO-END METHODOLOGY</Text>
              </View>
              <Text style={styles.sectionMainTitle}>6-Stage Seed-to-Harvest Lifecycle</Text>
              <Text style={styles.sectionMainSub}>
                A complete closed-loop agricultural operating methodology engineered for Indian cultivators from pre-sowing soil fertility to terminal APMC mandi settlements.
              </Text>
            </View>

            <View style={styles.farmingFeaturesGrid}>
              {FARMING_LIFECYCLE_STAGES.map((stage) => (
                <View
                  key={stage.step}
                  style={[
                    styles.farmingFeatureCard,
                    { borderColor: `${stage.color}30` },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={[styles.stageStepBox, { backgroundColor: stage.color }]}>
                      <Text style={styles.stageStepBoxText}>{stage.step}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={[styles.categoryPill, { backgroundColor: `${stage.color}12` }]}>
                        <Text style={[styles.categoryPillText, { color: stage.color }]}>{stage.tag}</Text>
                      </View>
                      <Text style={styles.farmingCardTitle} numberOfLines={1}>{stage.title}</Text>
                    </View>
                  </View>

                  <Text style={styles.farmingCardDesc}>{stage.desc}</Text>

                  <View style={styles.specsContainer}>
                    {stage.specs.map((spec, sIdx) => (
                      <View key={sIdx} style={styles.specItem}>
                        <Ionicons name="checkmark-circle" size={14} color={stage.color} />
                        <Text style={styles.specText}>{spec}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* 3. All 10 Core Farming Platform Features */}
            <View style={[styles.sectionHeaderRow, { marginTop: 42 }]}>
              <View style={[styles.sectionBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}35` }]}>
                <Ionicons name="apps" size={13} color={cfg.color} />
                <Text style={[styles.sectionBadgeText, { color: cfg.color }]}>COMPLETE FARMING OS CAPABILITIES</Text>
              </View>
              <Text style={styles.sectionMainTitle}>All Farming Platform Features</Text>
              <Text style={styles.sectionMainSub}>
                Explore every digital agritech tool, satellite telemetry module, and verified farm service engineered into FarmsKing.
              </Text>
            </View>

            <View style={styles.farmingFeaturesGrid}>
              {FARMING_ALL_FEATURES.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.farmingFeatureCard,
                    { borderColor: `${item.color}30` },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.featureIconContainer, { backgroundColor: `${item.color}14`, borderColor: `${item.color}30` }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={[styles.categoryPill, { backgroundColor: `${item.color}12` }]}>
                        <Text style={[styles.categoryPillText, { color: item.color }]}>{item.category}</Text>
                      </View>
                      <Text style={styles.farmingCardTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    <View style={[styles.microBadge, { backgroundColor: `${item.color}18`, borderColor: `${item.color}35` }]}>
                      <Text style={[styles.microBadgeText, { color: item.color }]}>{item.badge}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.farmingCardDesc}>{item.desc}</Text>

                  {/* Key Highlights / Specs */}
                  <View style={styles.specsContainer}>
                    {item.specs.map((spec, sIdx) => (
                      <View key={sIdx} style={styles.specItem}>
                        <Ionicons name="checkmark-circle" size={14} color={item.color} />
                        <Text style={styles.specText}>{spec}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Link Button */}
                  <TouchableOpacity
                    style={[styles.featureActionBtn, { backgroundColor: `${item.color}12`, borderColor: `${item.color}30` }]}
                    onPress={() => {
                      if (item.route.startsWith('tel:')) {
                        Linking.openURL(item.route);
                      } else {
                        router.push(item.route as any);
                      }
                    }}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.featureActionBtnText, { color: item.color }]}>{item.routeLabel}</Text>
                    <Ionicons name="arrow-forward" size={14} color={item.color} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── ALL CROP DOCTORS FEATURES SHOWCASE (WHEN ID IS CROP-DOCTORS) ── */}
        {(id === 'Crop-Doctors' || id === 'Crop Doctors') && (
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}35` }]}>
                <Ionicons name="medkit" size={13} color={cfg.color} />
                <Text style={[styles.sectionBadgeText, { color: cfg.color }]}>COMPLETE CROP DOCTORS CAPABILITIES</Text>
              </View>
              <Text style={styles.sectionMainTitle}>All Crop Doctors Platform Features</Text>
              <Text style={styles.sectionMainSub}>
                Explore multimodal AI plant pathology, certified agronomist consultations, dosage calculators, and genuine medicine supply engineered into FarmsKing.
              </Text>
            </View>

            <View style={styles.farmingFeaturesGrid}>
              {CROP_DOCTOR_ALL_FEATURES.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.farmingFeatureCard,
                    { borderColor: `${item.color}30` },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.featureIconContainer, { backgroundColor: `${item.color}14`, borderColor: `${item.color}30` }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={[styles.categoryPill, { backgroundColor: `${item.color}12` }]}>
                        <Text style={[styles.categoryPillText, { color: item.color }]}>{item.category}</Text>
                      </View>
                      <Text style={styles.farmingCardTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    <View style={[styles.microBadge, { backgroundColor: `${item.color}18`, borderColor: `${item.color}35` }]}>
                      <Text style={[styles.microBadgeText, { color: item.color }]}>{item.badge}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.farmingCardDesc}>{item.desc}</Text>

                  {/* Key Highlights / Specs */}
                  <View style={styles.specsContainer}>
                    {item.specs.map((spec, sIdx) => (
                      <View key={sIdx} style={styles.specItem}>
                        <Ionicons name="checkmark-circle" size={14} color={item.color} />
                        <Text style={styles.specText}>{spec}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Link Button */}
                  <TouchableOpacity
                    style={[styles.featureActionBtn, { backgroundColor: `${item.color}12`, borderColor: `${item.color}30` }]}
                    onPress={() => {
                      if (item.route.startsWith('tel:')) {
                        Linking.openURL(item.route);
                      } else {
                        router.push(item.route as any);
                      }
                    }}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.featureActionBtnText, { color: item.color }]}>{item.routeLabel}</Text>
                    <Ionicons name="arrow-forward" size={14} color={item.color} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── ALL GARDENING FEATURES SHOWCASE (WHEN ID IS GARDENING) ── */}
        {(id === 'Gardening' || id === 'gardening') && (
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionBadge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}35` }]}>
                <Ionicons name="leaf" size={13} color={cfg.color} />
                <Text style={[styles.sectionBadgeText, { color: cfg.color }]}>COMPLETE GARDENING ECOSYSTEM</Text>
              </View>
              <Text style={styles.sectionMainTitle}>All Gardening Platform Features</Text>
              <Text style={styles.sectionMainSub}>
                Explore doorstep live nursery deliveries, NASA air-purifiers, organic potting substrates, micro-drip kits, and AI garden diagnostics engineered into FarmsKing.
              </Text>
            </View>

            <View style={styles.farmingFeaturesGrid}>
              {GARDENING_ALL_FEATURES.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.farmingFeatureCard,
                    { borderColor: `${item.color}30` },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.featureIconContainer, { backgroundColor: `${item.color}14`, borderColor: `${item.color}30` }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={[styles.categoryPill, { backgroundColor: `${item.color}12` }]}>
                        <Text style={[styles.categoryPillText, { color: item.color }]}>{item.category}</Text>
                      </View>
                      <Text style={styles.farmingCardTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    <View style={[styles.microBadge, { backgroundColor: `${item.color}18`, borderColor: `${item.color}35` }]}>
                      <Text style={[styles.microBadgeText, { color: item.color }]}>{item.badge}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.farmingCardDesc}>{item.desc}</Text>

                  {/* Key Highlights / Specs */}
                  <View style={styles.specsContainer}>
                    {item.specs.map((spec, sIdx) => (
                      <View key={sIdx} style={styles.specItem}>
                        <Ionicons name="checkmark-circle" size={14} color={item.color} />
                        <Text style={styles.specText}>{spec}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Link Button */}
                  <TouchableOpacity
                    style={[styles.featureActionBtn, { backgroundColor: `${item.color}12`, borderColor: `${item.color}30` }]}
                    onPress={() => {
                      if (item.route.startsWith('tel:')) {
                        Linking.openURL(item.route);
                      } else {
                        router.push(item.route as any);
                      }
                    }}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.featureActionBtnText, { color: item.color }]}>{item.routeLabel}</Text>
                    <Ionicons name="arrow-forward" size={14} color={item.color} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

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

  // ── All Farming Features Showcase ──
  featuresSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeaderRow: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.2,
  },
  sectionMainTitle: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sectionMainSub: {
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 640,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  farmingFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  farmingFeatureCard: {
    flex: 1,
    minWidth: 340,
    maxWidth: 530,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
    ...premiumShadow('rgba(0,0,0,0.05)', 'sm'),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  categoryPillText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  farmingCardTitle: {
    fontSize: 15.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  pillarMetricText: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.5,
  },
  stageStepBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stageStepBoxText: {
    fontSize: 16.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  microBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexShrink: 0,
  },
  microBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  farmingCardDesc: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#475569',
    lineHeight: 20,
  },
  specsContainer: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  specText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#334155',
    flex: 1,
    lineHeight: 17,
  },
  featureActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginTop: 4,
  },
  featureActionBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
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
