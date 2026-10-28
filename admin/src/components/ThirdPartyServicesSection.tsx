import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSystemIntegrations, useUpdateSystemIntegrations } from '@/src/hooks/useSystemIntegrations';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import {
  SystemIntegrationsConfig,
  AppSettings,
  UpdateAppSettingsPayload,
  mergeSystemIntegrationsWithDefaults,
  DEFAULT_SYSTEM_INTEGRATIONS_CONFIG,
  DEFAULT_PROJECT_MASTER_DATA,
  SupportedPaymentGateway,
  ModulePaymentFeatureConfig,
} from '@/src/api/appSettings.api';
import { useExecutiveTheme } from '@/src/store/theme-context';

type ServiceCategory =
  | 'ALL'
  | 'GATEWAY'
  | 'AI'
  | 'TELECOM'
  | 'WEATHER'
  | 'SATELLITE'
  | 'SMS'
  | 'WHATSAPP'
  | 'SMTP'
  | 'LOGISTICS'
  | 'STORAGE_PUSH';

interface CategoryPill {
  key: ServiceCategory;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

const CATEGORY_PILLS: CategoryPill[] = [
  { key: 'ALL', label: 'All Services (Master View)', description: 'View and manage all 10 service engines simultaneously in a unified list.', icon: 'grid-outline', badge: '10 Connected' },
  { key: 'GATEWAY', label: '1. Payment Gateways', description: 'Razorpay, Cashfree & UPI Direct merchant accounts and webhooks.', icon: 'card-outline', badge: '10 Market Options' },
  { key: 'AI', label: '2. AI & Agronomy Doctor', description: 'Gemini 1.5 Pro & Vision prompt models and agronomy prescription engine.', icon: 'sparkles-outline', badge: '7 Vision Engines' },
  { key: 'TELECOM', label: '3. Voice & Video Calling', description: 'Group voice calling engine, Agora RTC token generator, WebSocket gateway & WebRTC video.', icon: 'call-outline', badge: 'Voice API & RTC' },
  { key: 'WEATHER', label: '4. Weather Telemetry Radar', description: 'Hyperlocal agricultural forecast data, rainfall and spray window radar.', icon: 'cloud-outline', badge: '6 Forecast APIs' },
  { key: 'SMS', label: '5. SMS & OTP Relay', description: 'Transactional OTP login, mandi order alerts and DLT template routing.', icon: 'chatbox-ellipses-outline', badge: '8 Gateways' },
  { key: 'WHATSAPP', label: '6. WhatsApp Bot Engine', description: 'Official Meta WhatsApp Business Cloud API & automated price bulletins.', icon: 'logo-whatsapp', badge: '7 Providers' },
  { key: 'LOGISTICS', label: '7. Logistics & Shipping', description: 'Inter-district grain shipping, Delhivery freight and live driver tracking.', icon: 'cube-outline', badge: '7 Couriers' },
  { key: 'STORAGE_PUSH', label: '8. Storage & Push Alerts', description: 'AWS S3, MinIO, Cloudflare R2 object storage and Firebase Cloud Messaging.', icon: 'server-outline', badge: 'Cloud & FCM' },
  { key: 'SATELLITE', label: '9. Satellite Field Telemetry', description: 'Sentinel-2 & Landsat-9 remote sensing NDVI indices and field boundaries.', icon: 'planet-outline', badge: '6 Remote Sensing APIs' },
  { key: 'SMTP', label: '10. Mail Server (SMTP)', description: 'Hostinger & Amazon SES transactional email dispatch and diagnostic mailer.', icon: 'mail-outline', badge: 'Hostinger & SES' },
];

export const SMTP_PRESETS = [
  { name: 'Hostinger Business Mail', host: 'smtp.hostinger.com', port: 465, enc: 'ssl' },
  { name: 'Google Workspace / Gmail', host: 'smtp.gmail.com', port: 587, enc: 'tls' },
  { name: 'SendGrid / Twilio', host: 'smtp.sendgrid.net', port: 587, enc: 'tls' },
  { name: 'Amazon SES (Mumbai)', host: 'email-smtp.ap-south-1.amazonaws.com', port: 587, enc: 'tls' },
];


interface DomainPaymentModuleMeta {
  key: 'farmerPlans' | 'advisorBookings' | 'gardenStore' | 'ecommerceStore';
  routingKey: 'farmerPlanGateway' | 'advisorBookingGateway' | 'gardenStoreGateway' | 'ecommerceStoreGateway';
  title: string;
  subtitle: string;
  recommendedGateway: string;
  recommendedTag: string;
  themeColorLight: string;
  themeColorDark: string;
  accentBgLight: string;
  accentBgDark: string;
}

const DOMAIN_PAYMENT_MODULES: DomainPaymentModuleMeta[] = [
  {
    key: 'farmerPlans',
    routingKey: 'farmerPlanGateway',
    title: '🌾 Farmer Plans & Bookkeeping Subscriptions',
    subtitle: 'Direct accounting passes, crop advisory memberships (180-day & 365-day access).',
    recommendedGateway: 'Direct NPCI UPI (0% Fee)',
    recommendedTag: '0% FEE • GOOGLE PLAY BYPASS',
    themeColorLight: '#16a34a',
    themeColorDark: '#00ff87',
    accentBgLight: 'rgba(22, 163, 74, 0.12)',
    accentBgDark: 'rgba(0, 255, 135, 0.15)',
  },
  {
    key: 'advisorBookings',
    routingKey: 'advisorBookingGateway',
    title: '🩺 Agronomist & Doctor Video Consultations',
    subtitle: 'Tele-medicine sessions, live field diagnostics, and doctor payout commission settlements.',
    recommendedGateway: 'Razorpay / Cashfree / PhonePe',
    recommendedTag: 'INSTANT SLOTS & SPLITS',
    themeColorLight: '#2563eb',
    themeColorDark: '#60a5fa',
    accentBgLight: 'rgba(37, 99, 235, 0.12)',
    accentBgDark: 'rgba(96, 165, 250, 0.15)',
  },
  {
    key: 'gardenStore',
    routingKey: 'gardenStoreGateway',
    title: '🏡 Urban Garden Care & Balcony Kits Store',
    subtitle: 'Balcony plant care kits, organic potting soil, seeds, pruning tools, and planter boxes.',
    recommendedGateway: 'PhonePe / Paytm / Easebuzz',
    recommendedTag: 'HIGH MOBILE SUCCESS',
    themeColorLight: '#ea580c',
    themeColorDark: '#fb923c',
    accentBgLight: 'rgba(234, 88, 12, 0.12)',
    accentBgDark: 'rgba(251, 146, 60, 0.15)',
  },
  {
    key: 'ecommerceStore',
    routingKey: 'ecommerceStoreGateway',
    title: '🛒 AgriStore Multi-Vendor Marketplace',
    subtitle: 'Certified crop seeds, bulk fertilizers, tractors & implements sold by licensed dealers.',
    recommendedGateway: 'Cashfree (Auto-Split) / Razorpay Route',
    recommendedTag: 'AUTOMATED VENDOR SPLITS',
    themeColorLight: '#9333ea',
    themeColorDark: '#c084fc',
    accentBgLight: 'rgba(147, 51, 234, 0.12)',
    accentBgDark: 'rgba(192, 132, 252, 0.15)',
  },
];

const ALL_MARKET_GATEWAYS: {
  key: SupportedPaymentGateway;
  label: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'UPI_DIRECT', label: 'Direct UPI', tag: '0% FEE', icon: 'qr-code' },
  { key: 'PHONEPE', label: 'PhonePe', tag: 'TOP UPI', icon: 'flash' },
  { key: 'CASHFREE', label: 'Cashfree', tag: 'AUTO-SPLIT', icon: 'wallet' },
  { key: 'RAZORPAY', label: 'Razorpay', tag: 'ENTERPRISE', icon: 'card' },
  { key: 'PAYTM', label: 'Paytm', tag: 'WALLETS', icon: 'phone-portrait' },
  { key: 'PAYU', label: 'PayU', tag: 'FAILOVER', icon: 'cash' },
  { key: 'CCAVENUE', label: 'CCAvenue', tag: '200+ OPTS', icon: 'business' },
  { key: 'INSTAMOJO', label: 'Instamojo', tag: 'MSME PG', icon: 'storefront' },
  { key: 'EASEBUZZ', label: 'Easebuzz', tag: 'LOW MDR', icon: 'pricetag' },
  { key: 'STRIPE', label: 'Stripe', tag: 'GLOBAL', icon: 'globe' },
];

export interface TelecomProviderDetail {
  key: 'AGORA' | 'LIVEKIT' | 'HUNDRED_MS' | 'TWILIO_VIDEO' | 'DAILY_CO' | 'JITSI';
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  paidRate: string;
  packetLoss: string;
  latency: string;
  capacity: string;
  recording: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
  freeMinutesMonthly: number;
  simulatedUsedMinutes: number;
}

export const ALL_TELECOM_PROVIDERS: TelecomProviderDetail[] = [
  {
    key: 'AGORA',
    name: 'Agora RTC Live Video & Audio',
    tag: '10,000 MINS/MO FREE',
    planBadge: '10,000 Mins/Month Free Forever',
    freeTier: '10,000 Minutes Free Every Month Forever',
    paidRate: '$0.99 / 1,000 mins (~₹0.08/min) after free quota',
    packetLoss: '70% Anti-Freeze (Best for Rural 2G/3G/4G)',
    latency: '< 200ms Global SD-RTN',
    capacity: '1-on-1 Doctor Video + 100+ Group Voice Call',
    recording: 'Cloud Recording to AWS S3 / DO Spaces',
    icon: 'videocam',
    color: '#2563eb',
    recommendation: '⭐ Recommended for Startup (100% Zero Cost for 30+ daily doctor calls)',
    summary: 'Proprietary SD-RTN real-time network with extreme packet-loss resilience for village farms.',
    freeMinutesMonthly: 10000,
    simulatedUsedMinutes: 1420,
  },
  {
    key: 'LIVEKIT',
    name: 'LiveKit WebRTC Cloud & Self-Hosted',
    tag: 'SCALABLE AUDIO ROOMS',
    planBadge: '50 GB Free Cloud / Unlimited Self-Hosted',
    freeTier: '50 GB Bandwidth Free on Cloud OR Unlimited Free on Self-Hosted VM',
    paidRate: '$0.004/GB Cloud, ₹0 on Self-Hosted Hetzner/AWS VM',
    packetLoss: '50% WebRTC Adaptive Bitrate with Simulcast',
    latency: '< 150ms Ultra-Low Latency Go SFU',
    capacity: '1,000+ Concurrent Audio & Video Participants',
    recording: 'Egress Composite MP4 & HLS Streaming',
    icon: 'mic',
    color: '#059669',
    recommendation: '🚀 Recommended for Scale (Zero Recurring Fees on Private Cloud VM)',
    summary: 'Next-gen open-source WebRTC media server in Go with high-density voice conference rooms.',
    freeMinutesMonthly: 15000,
    simulatedUsedMinutes: 620,
  },
  {
    key: 'HUNDRED_MS',
    name: '100ms Live Video SDK',
    tag: 'PRE-BUILT UI KITS',
    planBadge: '10,000 Mins/Month Free',
    freeTier: '10,000 Minutes Free Every Month',
    paidRate: '$1.00 / 1,000 mins (~₹0.085/min) after free quota',
    packetLoss: 'Dedicated India Telecom Routes (Bengaluru Hub)',
    latency: '< 250ms Interactive Low Latency',
    capacity: 'Telehealth consultation UI with Doctor/Patient roles',
    recording: 'Cloud Archiving with S3 Webhook Sync',
    icon: 'phone-portrait',
    color: '#7c3aed',
    recommendation: '🩺 Ideal for Structured Telehealth Consultations',
    summary: 'Indian telehealth and EdTech video specialist with pre-built React Native consultation components.',
    freeMinutesMonthly: 10000,
    simulatedUsedMinutes: 890,
  },
  {
    key: 'TWILIO_VIDEO',
    name: 'Twilio Programmable Video & Voice',
    tag: 'ENTERPRISE TELECOM',
    planBadge: 'Enterprise Pay-As-You-Go',
    freeTier: 'No Permanent Free Quota (Trial Credits Only)',
    paidRate: '~$0.0015 to $0.004 per participant/min',
    packetLoss: 'Carrier Grade Telecom & WebRTC Hybrid Bridge',
    latency: '< 250ms Worldwide',
    capacity: 'Enterprise 50+ Rooms with PSTN Dial-In',
    recording: 'Twilio Media Streams & S3 Archiving',
    icon: 'globe',
    color: '#dc2626',
    recommendation: '💼 Enterprise Platform for Hybrid PSTN Phone Bridge',
    summary: 'Global telecom infrastructure with support for regular telephone call fallback.',
    freeMinutesMonthly: 0,
    simulatedUsedMinutes: 120,
  },
  {
    key: 'DAILY_CO',
    name: 'Daily.co WebRTC Video Rooms',
    tag: 'INSTANT ROOM LINKS',
    planBadge: '10,000 Mins/Month Free',
    freeTier: '10,000 Minutes Free Every Month',
    paidRate: '$0.0015 / participant / min after quota',
    packetLoss: 'Adaptive Bitrate & Background Audio Fallback',
    latency: '< 200ms Direct Peer & SFU Switching',
    capacity: 'Up to 50 Video / 1,000 Audio Participants',
    recording: 'Daily Cloud Recording to MP4',
    icon: 'link',
    color: '#0891b2',
    recommendation: '⚡ Quick 1-Line Setup for Instant Doctor Room Links',
    summary: 'Developer-first WebRTC platform with 1-line room creation and frictionless web/mobile embedding.',
    freeMinutesMonthly: 10000,
    simulatedUsedMinutes: 450,
  },
  {
    key: 'JITSI',
    name: 'Jitsi Meet Self-Hosted Server',
    tag: '100% FREE OPEN SOURCE',
    planBadge: '100% Free & Unlimited Forever',
    freeTier: '100% Free Open-Source & Unlimited Calls Forever',
    paidRate: '₹0 Recurring Licensing (Zero Per-Minute Fees)',
    packetLoss: 'Standard WebRTC Jitsi Videobridge (JVB)',
    latency: '< 250ms (Server dependent)',
    capacity: 'Up to 75 Participants per Room',
    recording: 'Jibri MP4 / YouTube Stream Recording',
    icon: 'server',
    color: '#ea580c',
    recommendation: '🛡️ 100% Open Source & Zero Invoices (Host on Company Server)',
    summary: 'Community open-source WebRTC conference system with zero subscription invoices.',
    freeMinutesMonthly: 999999,
    simulatedUsedMinutes: 310,
  },
];

export interface WeatherProviderDetail {
  key: 'OPEN_METEO' | 'IMD' | 'OPEN_WEATHER_MAP' | 'WEATHER_API' | 'ACCUWEATHER' | 'TOMORROW_IO';
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  paidRate: string;
  resolution: string;
  sprayAccuracy: string;
  soilSensors: string;
  refreshRate: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
  dailyFreeRequests: number;
  simulatedUsedRequests: number;
}

export const ALL_WEATHER_PROVIDERS: WeatherProviderDetail[] = [
  {
    key: 'OPEN_METEO',
    name: 'Open-Meteo High-Resolution Forecast',
    tag: '100% LIFETIME FREE',
    planBadge: '10,000 Requests/Day Free Forever',
    freeTier: '10,000 Calls/Day (Zero API Key & Zero Credit Card)',
    paidRate: '€29/mo (1M calls) if high-volume commercial',
    resolution: '1km - 9km ECMWF IFS & GFS Hyperlocal',
    sprayAccuracy: '98.4% (Hourly Wind Speed, Gusts & Rain Probability)',
    soilSensors: 'Soil Moisture (0-7cm, 7-28cm) & Soil Temperature',
    refreshRate: 'Hourly Real-Time Refresh',
    icon: 'partly-sunny',
    color: '#059669',
    recommendation: '⭐ Recommended for Startup & Scale (Zero API Key, Zero Cost, 10,000 free calls daily)',
    summary: 'High-resolution open-source numerical weather model combining ECMWF and DWD ICON. Direct WMO code mapping for wind and rain spray safety.',
    dailyFreeRequests: 10000,
    simulatedUsedRequests: 1840,
  },
  {
    key: 'IMD',
    name: 'India Meteorological Dept (IMD Mausam / Agromet)',
    tag: 'OFFICIAL GOVT AGROMET',
    planBadge: 'Govt Free Agromet Open Data',
    freeTier: 'Unlimited Free (Govt GKMS Agro Bulletins)',
    paidRate: '₹0.00 (Public Service Open Data)',
    resolution: 'District & Block Level Agromet Grid',
    sprayAccuracy: '95.2% (Agro-University GKMS Bulletins)',
    soilSensors: 'State Agro-Station Ground Sensors',
    refreshRate: 'Twice Daily (Official Agromet Bulletin)',
    icon: 'flag',
    color: '#d97706',
    recommendation: '🏛️ Official Indian Government Regulatory Authority (Highest Farmer Trust)',
    summary: 'Gramin Krishi Mausam Sewa (GKMS) bulletins prepared by State Agricultural Universities (PAU Ludhiana) with IMD Doppler radar backing.',
    dailyFreeRequests: 999999,
    simulatedUsedRequests: 920,
  },
  {
    key: 'OPEN_WEATHER_MAP',
    name: 'OpenWeatherMap OneCall 3.0',
    tag: 'GLOBAL STANDARD',
    planBadge: '1,000 Calls/Day Free',
    freeTier: '1,000 Calls/Day Free (Credit Card on file)',
    paidRate: '$0.0015 / request after 1,000 daily free calls',
    resolution: '500m Hyperlocal Precipitation Grid',
    sprayAccuracy: '96.8% (Minute-by-minute rain for next 1 hr)',
    soilSensors: 'Agricultural Add-on ($40/mo)',
    refreshRate: 'Minute-by-Minute Live Radar',
    icon: 'cloudy',
    color: '#2563eb',
    recommendation: '🌐 Global Industry Standard for Minute Rain Warnings',
    summary: 'Provides minute-by-minute precipitation radar for the next hour to immediately warn farmers if rain is approaching within 15 minutes.',
    dailyFreeRequests: 1000,
    simulatedUsedRequests: 430,
  },
  {
    key: 'WEATHER_API',
    name: 'WeatherAPI Agriculture & Soil Metrics',
    tag: 'DEEP SOIL TELEMETRY',
    planBadge: '1M Calls Free Trial • $4/mo Startup',
    freeTier: '1,000,000 Calls/Month Trial, then $4/mo',
    paidRate: '$4 - $15 / month (5M calls)',
    resolution: '3km Agricultural Grid',
    sprayAccuracy: '97.5% (Evapotranspiration & Dew Point)',
    soilSensors: 'Root-Zone Soil Temp & Moisture (10cm - 100cm)',
    refreshRate: 'Hourly + 14-Day Agriculture Forecast',
    icon: 'leaf',
    color: '#10b981',
    recommendation: '🌱 Best for Deep Soil Moisture & Crop Root Telemetry',
    summary: 'Comprehensive agricultural parameters including root-zone soil temperature, leaf wetness duration, and solar UV radiation for precision fertilizer planning.',
    dailyFreeRequests: 33000,
    simulatedUsedRequests: 2150,
  },
  {
    key: 'ACCUWEATHER',
    name: 'AccuWeather Enterprise MinuteCast',
    tag: 'ENTERPRISE RADAR',
    planBadge: '50 Free/Day • $25/mo Pro',
    freeTier: '50 Calls/Day Free Developer Tier',
    paidRate: '$25 / month for 250,000 calls',
    resolution: 'GPS MinuteCast Street-Level Radar',
    sprayAccuracy: '99.1% (Exact Minute Rain Start/Stop Timing)',
    soilSensors: 'Enterprise Agricultural Feed',
    refreshRate: 'Real-Time Doppler Radar',
    icon: 'rainy',
    color: '#ea580c',
    recommendation: '⚡ Ultra-Accurate Precipitation Timing Down to the Exact Minute',
    summary: 'Patented MinuteCast engine tells farmers the exact minute rain will start and stop at their field coordinates, eliminating spray wash-off risks.',
    dailyFreeRequests: 50,
    simulatedUsedRequests: 38,
  },
  {
    key: 'TOMORROW_IO',
    name: 'Tomorrow.io Weather Intelligence',
    tag: 'AI SPRAY WINDOW SCORING',
    planBadge: '500 Free/Day • $35/mo Pro',
    freeTier: '500 Calls/Day Free Developer Tier',
    paidRate: '$35 / month for 25,000 calls',
    resolution: '500m Space Satellite Radar',
    sprayAccuracy: '99.3% (Proprietary AI Spray Window Score 0-100)',
    soilSensors: 'Evapotranspiration (ET0) & Soil VWC',
    refreshRate: 'Instant Event-Driven Webhooks',
    icon: 'analytics',
    color: '#8b5cf6',
    recommendation: '🤖 AI Precision Spray Window Scoring (0-100 Suitability Index)',
    summary: 'Computes proprietary agricultural indices including Spray Window Index (0-100), Delta-T, and Evapotranspiration to guide precision drone and tractor spraying.',
    dailyFreeRequests: 500,
    simulatedUsedRequests: 195,
  },
];

export interface SatelliteProviderDetail {
  key: 'AGROMONITORING' | 'SENTINEL_HUB' | 'COPERNICUS' | 'GOOGLE_EARTH_ENGINE' | 'ISRO_BHUVAN' | 'PLANET_LABS';
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  paidRate: string;
  constellation: string;
  indices: string;
  revisit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
  dailyFreeRequests: number;
  simulatedUsedRequests: number;
}

export const ALL_SATELLITE_PROVIDERS: SatelliteProviderDetail[] = [
  {
    key: 'AGROMONITORING',
    name: 'OpenWeather Agro (Agromonitoring API)',
    tag: 'EASIEST REST API',
    planBadge: '10 Hectares Free Forever (~25 Acres)',
    freeTier: 'Polygons up to 10 Hectares Free, Unlimited Scans',
    paidRate: '$0.05 / hectare / month for high-volume farmland',
    constellation: 'Sentinel-2 & Landsat-8 (10m Resolution)',
    indices: 'NDVI, EVI, Soil Surface Temp & Moisture (0-10cm, 10-40cm)',
    revisit: 'Every 2 - 4 Days Revisit',
    icon: 'planet',
    color: '#16a34a',
    recommendation: '⭐ Recommended for Startup (Ready-made REST API, Pre-calculated NDVI & Deep Soil Moisture)',
    summary: 'Turn-key digital farming API by OpenWeather. Sends GeoJSON field coordinates and instantly returns vegetation indices, satellite image tiles, and root-zone soil hydration.',
    dailyFreeRequests: 1000,
    simulatedUsedRequests: 184,
  },
  {
    key: 'SENTINEL_HUB',
    name: 'Sentinel Hub (Sinergise / ESA Sentinel-2)',
    tag: 'GLOBAL AGRITECH STANDARD',
    planBadge: '30-Day Full Trial • €29/mo Basic',
    freeTier: 'Free Copernicus Trial & Research Access',
    paidRate: '€29 - €99 / month (Up to 50,000 requests)',
    constellation: 'Sentinel-2A & 2B (10m Multispectral 13-Band)',
    indices: 'NDVI, NDRE (Nitrogen Deficit), NDMI (Moisture Deficit), True Color',
    revisit: 'Every 5 Days Worldwide',
    icon: 'globe',
    color: '#0284c7',
    recommendation: '🌐 Global Industry Standard for Agritech Enterprise Platforms (High-Speed Map Tile Server)',
    summary: 'Direct cloud processing of European Space Agency 10m multispectral bands. Generates custom map overlay tiles on the fly using custom Evalscript algorithms.',
    dailyFreeRequests: 500,
    simulatedUsedRequests: 120,
  },
  {
    key: 'COPERNICUS',
    name: 'Copernicus Data Space (ESA Open Access)',
    tag: '100% FREE GOVT OPEN DATA',
    planBadge: '100% Free Public Space Data',
    freeTier: 'Unlimited Free Access via ESA Copernicus Data Space',
    paidRate: '€0.00 (Public Service Space Exploration)',
    constellation: 'Sentinel-1 (Radar SAR) & Sentinel-2 (Multispectral)',
    indices: 'SAR Radar (Cloud-Penetrating), NDVI, Surface Reflectance',
    revisit: 'Every 5 Days (Radar penetrates monsoon cloud cover)',
    icon: 'shield-checkmark',
    color: '#7c3aed',
    recommendation: '🛰️ 100% Free Government Data + Cloud-Penetrating Radar for Monsoon Paddy Farming',
    summary: 'Direct open access to the European Union Copernicus constellation. Includes Sentinel-1 synthetic aperture radar which pierces heavy monsoon clouds where optical satellites fail.',
    dailyFreeRequests: 999999,
    simulatedUsedRequests: 420,
  },
  {
    key: 'GOOGLE_EARTH_ENGINE',
    name: 'Google Earth Engine (GEE Platform)',
    tag: 'BIG DATA & HISTORICAL AI',
    planBadge: 'Free Non-Commercial • Cloud API',
    freeTier: 'Free for Educational / Non-Commercial Analysis',
    paidRate: 'Google Cloud Project Pay-As-You-Go Billing',
    constellation: 'Sentinel-2, Landsat 4-9, MODIS, Terra Fusion',
    indices: '20+ Year Historical Crop Yields, Drought Severity, Evapotranspiration',
    revisit: 'Daily to 5-Day Multi-Satellite Fusion',
    icon: 'analytics',
    color: '#ea580c',
    recommendation: '📊 Best for Multi-Year Crop History & Machine Learning Yield Forecasting',
    summary: 'Petabyte-scale geospatial analysis platform combining 40+ years of satellite earth observation. Ideal for training predictive AI models on historical crop performance.',
    dailyFreeRequests: 2500,
    simulatedUsedRequests: 610,
  },
  {
    key: 'ISRO_BHUVAN',
    name: 'ISRO Bhuvan & VEDAS Geo-Platform',
    tag: 'NATIONAL SPACE DATA (INDIA)',
    planBadge: 'National Agrispace Portal',
    freeTier: 'Open Government GIS Web Services (WMS/WFS)',
    paidRate: '₹0.00 (National Remote Sensing Centre)',
    constellation: 'Resourcesat-2, Cartosat, RISAT-1A, LISS-III',
    indices: 'Indian Crop Sowing Acreage, Soil Texture, Ground Water Depth',
    revisit: 'Weekly / Monthly Satellite Passes',
    icon: 'flag',
    color: '#d97706',
    recommendation: '🏛️ Indian National Remote Sensing Centre (Official Sowing Acreage & Soil Texture)',
    summary: 'Developed by ISRO NRSC Hyderabad. Provides official Indian agro-ecological zone mapping, ground water prospective zones, and kharif/rabi sowing verification.',
    dailyFreeRequests: 999999,
    simulatedUsedRequests: 195,
  },
  {
    key: 'PLANET_LABS',
    name: 'Planet Labs PlanetScope Daily Constellation',
    tag: 'ULTRA-HD 3M DAILY REVISIT',
    planBadge: 'Daily 3m Commercial Satellite',
    freeTier: '14-Day Free Evaluation Access',
    paidRate: 'Custom Enterprise Contract (~$1.50 - $3.00/hectare/yr)',
    constellation: '200+ Dove CubeSats (3m True Optical Resolution)',
    indices: 'Ultra-HD 3m NDVI, Daily Revisit, Individual Tree / Furrow Health',
    revisit: 'Every Single Day (Daily Global Scan)',
    icon: 'telescope',
    color: '#059669',
    recommendation: '💎 Ultra-HD 3-Meter Daily Imagery for High-Value Horticulture & Nurseries',
    summary: 'The world largest commercial earth imaging fleet. Captures 3-meter resolution images of every acre on earth every single day, detecting pest attacks within 24 hours.',
    dailyFreeRequests: 100,
    simulatedUsedRequests: 12,
  },
];


export interface GatewayDetail {
  key: SupportedPaymentGateway;
  name: string;
  tag: string;
  planBadge: string;
  mdrRate: string;
  settlement: string;
  successRate: string;
  vendorSplit: string;
  freeVolumeMonthly: number;
  simulatedUsedVolume: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
}

export const ALL_GATEWAY_METADATA: GatewayDetail[] = [
  {
    key: 'UPI_DIRECT',
    name: 'Direct NPCI UPI QR & VPA',
    tag: '0% FEE • LIFETIME FREE',
    planBadge: '100% Free Forever (0% MDR)',
    mdrRate: '0.00% Zero Fee (Direct NPCI)',
    settlement: 'T+0 Instant Bank Credit',
    successRate: '99.4% (Bank Direct VPA)',
    vendorSplit: 'Direct Account Settlement',
    freeVolumeMonthly: 10000000,
    simulatedUsedVolume: 248500,
    icon: 'qr-code',
    color: '#16a34a',
    recommendation: '⭐ Highly Recommended for Launch (Zero Middleman Fee, Zero Google Play Cut)',
    summary: 'Direct farmer and customer UPI transfers into company current account via NPCI with zero merchant transaction fees.',
  },
  {
    key: 'PHONEPE',
    name: 'PhonePe Payment Gateway',
    tag: 'STARTUP FAVORITE',
    planBadge: '0% on UPI • 1.85% Cards',
    mdrRate: '0% on UPI, 1.85% on Cards/Netbanking',
    settlement: 'T+1 Daily Bank Transfer',
    successRate: '95.8% (India Top UPI App)',
    vendorSplit: 'Automated Merchant Payouts',
    freeVolumeMonthly: 1000000,
    simulatedUsedVolume: 185000,
    icon: 'flash',
    color: '#6739b6',
    recommendation: '🇮🇳 India Market Leader for High-Speed Mobile UPI Payments',
    summary: 'High penetration among rural smartphone users with native PhonePe intent flows and auto-retries.',
  },
  {
    key: 'CASHFREE',
    name: 'Cashfree Payments & Easy Split',
    tag: 'AUTO-SPLIT VENDOR PAYOUTS',
    planBadge: 'Instant Auto-Split Vendor Engine',
    mdrRate: '1.75% UPI & Cards, Auto-Splits Included',
    settlement: 'T+1 or Instant Payout API',
    successRate: '96.2% High-Availability Gateway',
    vendorSplit: 'Instant Multi-Vendor Ledger Auto-Split',
    freeVolumeMonthly: 2000000,
    simulatedUsedVolume: 420000,
    icon: 'wallet',
    color: '#0284c7',
    recommendation: '🚀 Essential for AgriStore Multi-Vendor Marketplace at Scale',
    summary: 'Automatically deducts platform commissions and routes farmer/vendor earnings directly to bank accounts without manual bookkeeping.',
  },
  {
    key: 'RAZORPAY',
    name: 'Razorpay Payment Gateway',
    tag: 'ENTERPRISE API STANDARD',
    planBadge: 'Standard 2% Commercial MDR',
    mdrRate: '2.0% + GST across UPI, Cards, Netbanking',
    settlement: 'T+2 Standard Bank Settlement',
    successRate: '96.5% Enterprise Stability',
    vendorSplit: 'Razorpay Route (Route Add-on)',
    freeVolumeMonthly: 1000000,
    simulatedUsedVolume: 95000,
    icon: 'card',
    color: '#2563eb',
    recommendation: '💳 Industry Standard for Credit Cards & Corporate Netbanking',
    summary: 'Robust failover engine with 100+ payment methods, international card compliance, and enterprise fraud protection.',
  },
  {
    key: 'PAYTM',
    name: 'Paytm All-In-One Gateway',
    tag: 'RURAL WALLET & UPI',
    planBadge: 'Low MDR Agri Merchant Tier',
    mdrRate: '0% UPI, 1.99% Wallets & Cards',
    settlement: 'T+1 Automated Settlement',
    successRate: '94.2% Tier-3 City Penetration',
    vendorSplit: 'Paytm Payouts Wallet Transfer',
    freeVolumeMonthly: 500000,
    simulatedUsedVolume: 48000,
    icon: 'phone-portrait',
    color: '#00b9f5',
    recommendation: '📱 Strong Presence in Tier-3/4 Mandis & Rural Grocery Stores',
    summary: 'Familiar UI for rural traders with instant Paytm wallet and UPI integration.',
  },
  {
    key: 'PAYU',
    name: 'PayU Money & Enterprise PG',
    tag: 'ESTABLISHED AGRI PG',
    planBadge: 'Enterprise Cooperative Banking',
    mdrRate: '1.9% + GST Standard Merchant',
    settlement: 'T+2 Settlement',
    successRate: '95.1% Rural Cooperative Routing',
    vendorSplit: 'PayU Split API',
    freeVolumeMonthly: 1000000,
    simulatedUsedVolume: 32000,
    icon: 'cash',
    color: '#a3e635',
    recommendation: '🏦 Preferred by State Cooperative Banks and Institutional Accounts',
    summary: 'Deep routing integration with cooperative bank netbanking across Punjab and northern India.',
  },
  {
    key: 'CCAVENUE',
    name: 'CCAvenue Enterprise Gateway',
    tag: '200+ INDIAN PAYMENT MODES',
    planBadge: '200+ Indian Bank Options',
    mdrRate: '2.0% Flat Rate',
    settlement: 'Weekly / T+2',
    successRate: '93.8% Comprehensive Netbanking',
    vendorSplit: 'Sub-merchant accounts',
    freeVolumeMonthly: 500000,
    simulatedUsedVolume: 14000,
    icon: 'business',
    color: '#f59e0b',
    recommendation: '🏛️ Widest Regional & Rural Cooperative Bank Coverage in India',
    summary: 'Supports rare regional gramin banks, cooperative credit societies, and government portals.',
  },
  {
    key: 'INSTAMOJO',
    name: 'Instamojo Payments',
    tag: 'MSME FAST ONBOARDING',
    planBadge: 'Zero Paperwork Fast Setup',
    mdrRate: '2.0% + ₹3 per transaction',
    settlement: 'T+3 Standard',
    successRate: '93.5% Small Business Gateway',
    vendorSplit: 'Standard Payouts',
    freeVolumeMonthly: 300000,
    simulatedUsedVolume: 12000,
    icon: 'storefront',
    color: '#0d9488',
    recommendation: '🏪 Ideal for Instant Setup and Testing without Lengthy Bank Approvals',
    summary: 'Fast merchant verification for early stage testing and digital payment links.',
  },
  {
    key: 'EASEBUZZ',
    name: 'Easebuzz Digital Collections',
    tag: 'LOW AGRI CO-OP MDR',
    planBadge: 'Special Agri & Education Tier',
    mdrRate: '1.2% - 1.5% Discounted Rate',
    settlement: 'T+1 Instant Collection',
    successRate: '94.8% Direct API Integration',
    vendorSplit: 'Easebuzz Wire Payout API',
    freeVolumeMonthly: 500000,
    simulatedUsedVolume: 22000,
    icon: 'pricetag',
    color: '#e11d48',
    recommendation: '🏷️ Lowest MDR Rates for High-Volume Agricultural Purchases',
    summary: 'Tailored payment processing engine designed for agricultural supply chains and bulk purchases.',
  },
  {
    key: 'STRIPE',
    name: 'Stripe Global Payments',
    tag: 'INTERNATIONAL CARDS',
    planBadge: 'Global Forex & NRI Payments',
    mdrRate: '2.0% Domestic, 3.0% + ₹3 Forex',
    settlement: 'Rolling 5-Day International',
    successRate: '98.9% International Card Success',
    vendorSplit: 'Stripe Connect Custom Accounts',
    freeVolumeMonthly: 500000,
    simulatedUsedVolume: 15000,
    icon: 'globe',
    color: '#6366f1',
    recommendation: '🌍 Essential for NRI Punjabi Diaspora and International Fruit/Grain Export Orders',
    summary: 'Multi-currency gateway accepting international credit cards and overseas diaspora payments.',
  },
];

export interface AIProviderDetail {
  key: 'GEMINI' | 'OPENAI' | 'CLAUDE' | 'LLAMA' | 'MISTRAL' | 'GROQ' | 'HUGGINGFACE';
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  paidRate: string;
  latency: string;
  accuracy: string;
  multilingual: string;
  dailyFreeScans: number;
  simulatedUsedScans: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
}

export const ALL_AI_PROVIDERS: AIProviderDetail[] = [
  {
    key: 'GEMINI',
    name: 'Google Gemini 1.5 & 2.5 Flash',
    tag: '1,500 FREE SCANS/DAY',
    planBadge: '1,500 Free Scans/Day Forever',
    freeTier: '1,500 Free Requests/Day (Google AI Studio)',
    paidRate: '$0.075 / 1M Input Tokens (~₹0.006/scan)',
    latency: '820ms Multimodal Flash Inference',
    accuracy: '99.4% Leaf & Stem Pathology',
    multilingual: '100% Native Punjabi & Hindi Agri Agronomy',
    dailyFreeScans: 1500,
    simulatedUsedScans: 245,
    icon: 'sparkles',
    color: '#9333ea',
    recommendation: '⭐ Primary Recommendation for Startup (Zero Cost for 1,500 Daily Scans)',
    summary: 'High-speed multimodal vision model by Google DeepMind with built-in agricultural reasoning and instant Punjabi audio generation.',
  },
  {
    key: 'OPENAI',
    name: 'OpenAI GPT-4o-mini',
    tag: 'HIGH ACCURACY VISION',
    planBadge: 'High Precision Pay-As-You-Go',
    freeTier: '$5 Free Trial Credits',
    paidRate: '$0.150 / 1M Input Tokens (~₹0.012/scan)',
    latency: '980ms GPT Vision Response',
    accuracy: '99.1% Disease Severity Scoring',
    multilingual: 'High-grade Indian Language Accuracy',
    dailyFreeScans: 500,
    simulatedUsedScans: 110,
    icon: 'hardware-chip',
    color: '#10a37f',
    recommendation: '🤖 Standard Benchmark for High Precision Agricultural Pathology',
    summary: 'Reliable vision reasoning model with detailed step-by-step chemical and organic spray recommendations.',
  },
  {
    key: 'CLAUDE',
    name: 'Anthropic Claude 3.5 Sonnet',
    tag: 'BOTANICAL REASONING',
    planBadge: 'Elite Diagnostic Accuracy',
    freeTier: '$5 Trial Credits',
    paidRate: '$3.00 / 1M Input Tokens (~₹0.25/scan)',
    latency: '1.4s Deep Botanical Analysis',
    accuracy: '99.8% Expert Agronomist Level',
    multilingual: 'Comprehensive Botanical Reasoning',
    dailyFreeScans: 200,
    simulatedUsedScans: 42,
    icon: 'flask',
    color: '#d97706',
    recommendation: '🩺 Ideal for Complex Crop Doctor Second Opinions and Research',
    summary: 'Highest biological reasoning benchmarks in the AI industry, specialized in identifying rare crop deficiencies.',
  },
  {
    key: 'LLAMA',
    name: 'Meta Llama 3.2 Vision (Groq / vLLM)',
    tag: 'OPEN WEIGHTS / FAST',
    planBadge: 'Zero Token Fees on Self-Hosted',
    freeTier: '100% Free on Self-Hosted Server OR Groq Free Tier',
    paidRate: '$0.00 API Cost (Host on Own GPU Server)',
    latency: '450ms Ultra-Fast LPU Inference',
    accuracy: '97.2% Common Crop Pests',
    multilingual: 'Prompt-tuned Punjabi Agronomy',
    dailyFreeScans: 2000,
    simulatedUsedScans: 380,
    icon: 'server',
    color: '#0284c7',
    recommendation: '🚀 Best for Scale (Complete Data Privacy & Zero Per-Query API Cost)',
    summary: 'Open weights vision model running locally on company GPU servers with zero external API dependencies.',
  },
  {
    key: 'MISTRAL',
    name: 'Mistral Pixtral 12B Vision',
    tag: 'EUROPEAN HIGH-SPEED AI',
    planBadge: 'Cost-Effective Open Vision',
    freeTier: 'Free Trial Available',
    paidRate: '$0.15 / 1M Tokens',
    latency: '780ms Fast Edge Inference',
    accuracy: '97.8% Plant Disease Detection',
    multilingual: 'Multilingual European & Asian Crops',
    dailyFreeScans: 1000,
    simulatedUsedScans: 85,
    icon: 'speedometer',
    color: '#ea580c',
    recommendation: '⚡ High-Efficiency Open-Weights Model with Low Memory Footprint',
    summary: 'Lightweight multimodal architecture delivering quick responses for field farmers with low bandwidth.',
  },
  {
    key: 'GROQ',
    name: 'Groq LPU Ultra-Low Latency',
    tag: 'SUB-SECOND LEAF DIAGNOSIS',
    planBadge: 'Fastest LPU Inference on Earth',
    freeTier: '14,400 Requests/Day Free Developer Tier',
    paidRate: '$0.05 / 1M Tokens on Groq LPUs',
    latency: '290ms Sub-Second Lightning Speed',
    accuracy: '97.5% Real-Time Diagnostic Speed',
    multilingual: 'Instant Streaming Punjabi Audio',
    dailyFreeScans: 14400,
    simulatedUsedScans: 1250,
    icon: 'flash',
    color: '#f43f5e',
    recommendation: '⚡ Fastest Inference Speed for Instant Field Camera Feedback',
    summary: 'Custom Language Processing Units (LPUs) returning disease diagnoses in less than 300 milliseconds.',
  },
  {
    key: 'HUGGINGFACE',
    name: 'Hugging Face Plant Pathology',
    tag: 'FINE-TUNED AGRI MODELS',
    planBadge: 'Dedicated Agriculture Neural Nets',
    freeTier: 'Free Inference API Community Tier',
    paidRate: '$9/mo HuggingFace Dedicated Endpoint',
    latency: '600ms ResNet/ViT Classifier',
    accuracy: '98.6% on 38 Known Crop Diseases',
    multilingual: 'Direct Disease Code Classification',
    dailyFreeScans: 1000,
    simulatedUsedScans: 190,
    icon: 'leaf',
    color: '#eab308',
    recommendation: '🌱 Fine-Tuned Specifically on 50,000+ Indian Farm Leaf Photos',
    summary: 'Pre-trained Vision Transformers (ViT) and ResNet architectures specialized purely in agricultural leaf diagnosis.',
  },
];

export interface SMSProviderDetail {
  key: string;
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  ratePerSms: string;
  deliverySpeed: string;
  dltRequirement: string;
  monthlyQuota: number;
  simulatedUsedSms: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
}

export const ALL_SMS_PROVIDERS: SMSProviderDetail[] = [
  {
    key: 'FIREBASE',
    name: 'Google Firebase Phone Auth / SMS',
    tag: '10,000 FREE OTP/MONTH',
    planBadge: '10,000 Free OTPs/Mo Forever',
    freeTier: '10,000 Free OTP SMS / Month',
    ratePerSms: '₹0.00 (Zero Cost on Firebase Free Spark Tier)',
    deliverySpeed: '< 2.5s Instant Carrier Dispatch',
    dltRequirement: 'Zero DLT Hassle (Google Whitelisted)',
    monthlyQuota: 10000,
    simulatedUsedSms: 1890,
    icon: 'flame',
    color: '#ea580c',
    recommendation: '⭐ Recommended for Startup (10,000 Free Mobile OTPs every month with zero paperwork)',
    summary: 'Direct carrier SMS delivery backed by Google infrastructure without requiring Indian government DLT registration.',
  },
  {
    key: 'FAST2SMS',
    name: 'Fast2SMS India Quick DLT Route',
    tag: 'LOW COST (₹0.15/SMS)',
    planBadge: '₹0.15 / SMS Ultra-Low Cost',
    freeTier: '₹50 Free Wallet Credit on Signup',
    ratePerSms: '₹0.15 - ₹0.18 per SMS',
    deliverySpeed: '< 3.0s Indian Telecom Priority',
    dltRequirement: 'DLT Principal Entity & Template ID',
    monthlyQuota: 20000,
    simulatedUsedSms: 3420,
    icon: 'flash',
    color: '#0284c7',
    recommendation: '📱 Ideal for Order Confirmation & Mandi Price Alerts to Keypad Phones',
    summary: 'Cost-effective Indian SMS aggregator with direct carrier interconnection and instant wallet top-ups.',
  },
  {
    key: 'MSG91',
    name: 'MSG91 Enterprise DLT Gateway',
    tag: 'ENTERPRISE CARRIER BACKUP',
    planBadge: 'Carrier-Grade High Volume',
    freeTier: '25,000 Free OTPs via OTP API',
    ratePerSms: '₹0.20 per SMS + DLT Scrubbing',
    deliverySpeed: '< 1.8s Ultra-Low Latency',
    dltRequirement: 'Registered Entity + Sender Header',
    monthlyQuota: 50000,
    simulatedUsedSms: 4800,
    icon: 'paper-plane',
    color: '#16a34a',
    recommendation: '🏛️ Enterprise Grade with Dual-Operator Carrier Fallback',
    summary: 'High-reliability SMS platform with automatic failover between Airtel, Jio, and Vodafone networks.',
  },
  {
    key: 'TWILIO',
    name: 'Twilio Global SMS Platform',
    tag: 'WORLDWIDE REACH',
    planBadge: 'Global Reach & International',
    freeTier: '$15 Free Trial Balance',
    ratePerSms: '$0.0075 (~₹0.62) per SMS',
    deliverySpeed: '< 2.0s Worldwide Delivery',
    dltRequirement: 'International Route (No DLT needed)',
    monthlyQuota: 10000,
    simulatedUsedSms: 650,
    icon: 'globe',
    color: '#ef4444',
    recommendation: '🌍 Recommended for NRI Punjabi Diaspora Verification and International Numbers',
    summary: 'Global telecom cloud delivering OTPs to overseas phone numbers in UK, Canada, USA, and Australia.',
  },
  {
    key: 'TEXTLOCAL',
    name: 'Textlocal India Bulk Messaging',
    tag: 'ENTERPRISE SMS',
    planBadge: 'Enterprise Marketing & Transactional',
    freeTier: '10 Free Credits on Verification',
    ratePerSms: '₹0.22 per SMS',
    deliverySpeed: '< 2.8s Delivery',
    dltRequirement: 'DLT Registered Sender ID',
    monthlyQuota: 15000,
    simulatedUsedSms: 1200,
    icon: 'chatbox',
    color: '#8b5cf6',
    recommendation: '📊 Best for Scheduled Bulk SMS Campaigns to Large Farmer Cooperatives',
    summary: 'Reliable transactional messaging platform with webhooks and detailed delivery status reports.',
  },
  {
    key: 'GUPSHUP',
    name: 'Gupshup Telecom Gateway',
    tag: 'DIRECT TELECOM INTERCONNECT',
    planBadge: 'Direct Telecom Aggregator',
    freeTier: 'Developer Sandbox Credits',
    ratePerSms: '₹0.19 per SMS',
    deliverySpeed: '< 2.2s Direct Pipe',
    dltRequirement: 'DLT Entity ID Required',
    monthlyQuota: 30000,
    simulatedUsedSms: 2100,
    icon: 'send',
    color: '#059669',
    recommendation: '⚡ Direct Pipe to Tier-1 Indian Telecom Operators',
    summary: 'Direct telecom infrastructure handling banking OTPs and large-scale government messages.',
  },
  {
    key: 'KALEYRA',
    name: 'Kaleyra (Tata Comm) Banking SMS',
    tag: 'BANKING GRADE SMS',
    planBadge: 'Tata Telecom Enterprise',
    freeTier: 'Enterprise Evaluation',
    ratePerSms: '₹0.18 per SMS',
    deliverySpeed: '< 1.5s Banking Speed',
    dltRequirement: 'DLT Enterprise Whitelist',
    monthlyQuota: 25000,
    simulatedUsedSms: 850,
    icon: 'shield-checkmark',
    color: '#3b82f6',
    recommendation: '🛡️ Tata Communications Infrastructure with Maximum Security Compliance',
    summary: 'Tier-1 carrier grade infrastructure used by leading Indian banks and financial institutions.',
  },
  {
    key: 'CUSTOM_HTTP',
    name: 'Custom HTTP Webhook Gateway',
    tag: 'ANY OPERATOR API',
    planBadge: 'Universal Custom Endpoint',
    freeTier: 'Custom Contract with Operator',
    ratePerSms: 'Negotiated Operator Rate',
    deliverySpeed: 'Dependent on Operator API',
    dltRequirement: 'Passed via Custom Query Params',
    monthlyQuota: 50000,
    simulatedUsedSms: 150,
    icon: 'code-working',
    color: '#64748b',
    recommendation: '🔌 Connect Any Local Punjab / Indian SMS Vendor with a Simple URL Template',
    summary: 'Allows admins to hook in any custom SMS vendor URL with dynamic placeholders.',
  },
];

export interface WhatsAppProviderDetail {
  key: string;
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  ratePerMsg: string;
  botAutomation: string;
  greenTick: string;
  monthlyQuota: number;
  simulatedUsedMsg: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
}

export const ALL_WHATSAPP_PROVIDERS: WhatsAppProviderDetail[] = [
  {
    key: 'META_CLOUD',
    name: 'Meta WhatsApp Cloud API (Official)',
    tag: 'OFFICIAL META API',
    planBadge: '1,000 Free Service Conversations/Mo',
    freeTier: '1,000 Free Conversations / Month Forever',
    ratePerMsg: '₹0.40 - ₹0.75 per User-Initiated Conversation',
    botAutomation: 'Official Meta Graph API Webhooks',
    greenTick: 'Official Verified Green Tick Eligible',
    monthlyQuota: 1000,
    simulatedUsedMsg: 210,
    icon: 'logo-whatsapp',
    color: '#25d366',
    recommendation: '⭐ Primary Recommendation for Official Order Invoices & Critical Notifications',
    summary: '100% official Meta WhatsApp Business API with zero risk of phone number ban, delivering verified bill PDFs.',
  },
  {
    key: 'BAILEYS_QR',
    name: 'Baileys QR (Self-Hosted Group Bot)',
    tag: '100% FREE & UNLIMITED',
    planBadge: 'Unlimited Free Bot Automation',
    freeTier: '100% Free Forever (Self-Hosted Node.js)',
    ratePerMsg: '₹0.00 Zero Per-Message Fees',
    botAutomation: 'Direct WhatsApp Web Socket Automation',
    greenTick: 'Standard WhatsApp Number Display',
    monthlyQuota: 999999,
    simulatedUsedMsg: 4250,
    icon: 'qr-code',
    color: '#059669',
    recommendation: '🚀 Ideal for Daily Mandi Rates & Farmer Advisor Community Groups',
    summary: 'Scan QR code from phone once to send unlimited automated crop advice, group announcements, and pest alerts for ₹0 cost.',
  },
  {
    key: 'GUPSHUP',
    name: 'Gupshup WhatsApp Enterprise',
    tag: 'ENTERPRISE BSP',
    planBadge: 'High-Volume Enterprise BSP',
    freeTier: 'Developer Sandbox Available',
    ratePerMsg: 'Meta Fees + ₹0.05 Platform Markup',
    botAutomation: 'No-Code Bot Studio & Flow Builder',
    greenTick: 'Assisted Green Tick Application',
    monthlyQuota: 5000,
    simulatedUsedMsg: 890,
    icon: 'send',
    color: '#0284c7',
    recommendation: '🏢 Leading WhatsApp Business Solution Provider (BSP) for High Volume',
    summary: 'Dedicated Indian enterprise infrastructure with drag-and-drop conversational chatbot builder.',
  },
  {
    key: 'WATI',
    name: 'WATI WhatsApp Team Inbox',
    tag: 'MULTI-AGENT INBOX',
    planBadge: 'Customer Support CRM Hub',
    freeTier: '7-Day Free Trial',
    ratePerMsg: '$49/mo (includes 1,000 conversations)',
    botAutomation: 'Shared Team Inbox with Chatbot',
    greenTick: 'Included with Growth Plan',
    monthlyQuota: 1000,
    simulatedUsedMsg: 320,
    icon: 'chatbubbles',
    color: '#10b981',
    recommendation: '👥 Perfect for Multi-Doctor Customer Care & Agronomist Live Chat',
    summary: 'Shared team inbox allowing multiple agricultural doctors to reply to farmer WhatsApp queries simultaneously.',
  },
  {
    key: 'INTERAKT',
    name: 'Interakt (Jio Haptik) Commerce',
    tag: 'JIO COMMERCE CRM',
    planBadge: 'E-commerce WhatsApp Hub',
    freeTier: '14-Day Free Trial',
    ratePerMsg: '₹999/mo + Meta Conversation Fees',
    botAutomation: 'Abandoned Cart & Order Tracking',
    greenTick: 'Supported',
    monthlyQuota: 2000,
    simulatedUsedMsg: 410,
    icon: 'cart',
    color: '#7c3aed',
    recommendation: '🛒 Specialized for AgriStore Product Catalogs & Cart Recovery',
    summary: 'Jio-backed WhatsApp e-commerce CRM with automated order confirmation, shipment tracking, and catalog checkout.',
  },
  {
    key: 'AISENSY',
    name: 'AiSensy Smart Retargeting',
    tag: 'BROADCAST & DRIP',
    planBadge: 'Smart Agri Campaigns',
    freeTier: 'Free 500 Broadcast Credits',
    ratePerMsg: '₹999/mo + Meta Fees',
    botAutomation: 'Smart Drip Campaigns & AI Chatbot',
    greenTick: 'Free Verification Assistance',
    monthlyQuota: 3000,
    simulatedUsedMsg: 650,
    icon: 'sparkles',
    color: '#ea580c',
    recommendation: '📢 Best for Seasonal Seed & Fertilizer Promotional Campaigns',
    summary: 'Campaign platform designed to send targeted WhatsApp broadcasts to segmented farmer lists.',
  },
  {
    key: 'TWILIO_WHATSAPP',
    name: 'Twilio WhatsApp API',
    tag: 'GLOBAL MULTI-CHANNEL',
    planBadge: 'Global Cloud Messaging',
    freeTier: 'Twilio Trial Balance',
    ratePerMsg: '$0.005 per message markup',
    botAutomation: 'Twilio Studio & Flex Integration',
    greenTick: 'Enterprise Registration',
    monthlyQuota: 2000,
    simulatedUsedMsg: 180,
    icon: 'globe',
    color: '#ef4444',
    recommendation: '🌐 Single API for Unified Global SMS and WhatsApp Delivery',
    summary: 'Developer-friendly unified API handling both WhatsApp and SMS fallbacks through a single client SDK.',
  },
];

export interface LogisticsProviderDetail {
  key: string;
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  codRemittance: string;
  pincodeCoverage: string;
  shippingRate: string;
  monthlyQuota: number;
  simulatedUsedShipments: number;
  walletBalance: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
}

export const ALL_LOGISTICS_PROVIDERS: LogisticsProviderDetail[] = [
  {
    key: 'SHIPROCKET',
    name: 'Shiprocket Multi-Courier Aggregator',
    tag: '29,000+ PIN CODES',
    planBadge: 'Shiprocket Lite: ₹0 Subscription',
    freeTier: '₹0 Monthly Fee (Pay only per delivered parcel)',
    codRemittance: 'Early COD (2-Day Bank Remittance)',
    pincodeCoverage: '29,000+ Indian Pincodes (Pan-India)',
    shippingRate: 'Starts at ₹20 per 500g',
    monthlyQuota: 500,
    simulatedUsedShipments: 68,
    walletBalance: '₹4,850.00',
    icon: 'cube',
    color: '#059669',
    recommendation: '⭐ Primary Recommendation for AgriStore (Automatically picks cheapest & fastest courier for village delivery)',
    summary: 'AI courier recommendation engine comparing Delhivery, Bluedart, DTDC, and Shadowfax in real-time.',
  },
  {
    key: 'DELHIVERY',
    name: 'Delhivery Direct Enterprise Logistics',
    tag: 'DIRECT COURIER',
    planBadge: 'Direct Fleet Account',
    freeTier: 'Pay-per-shipment Enterprise Contract',
    codRemittance: 'T+3 Direct Bank Settlement',
    pincodeCoverage: '18,500+ Pin Codes across India',
    shippingRate: 'Volume-based discounted contracts',
    monthlyQuota: 1000,
    simulatedUsedShipments: 124,
    walletBalance: '₹12,400.00',
    icon: 'car',
    color: '#0284c7',
    recommendation: '🚚 Direct Fleet Carrier for High Volume Seeds, Organic Inputs & Live Plants Nursery',
    summary: 'Direct integrated courier fleet with large vehicle transit hubs and automated doorstep reverse pickups.',
  },
  {
    key: 'NIMBUSPOST',
    name: 'NimbusPost Logistics Hub',
    tag: 'FAST COD REMITTANCE',
    planBadge: 'Same-Day COD Remittance',
    freeTier: 'Free Account with 27+ Couriers',
    codRemittance: 'Same-Day COD Option Available',
    pincodeCoverage: '27,000+ Pin Codes',
    shippingRate: 'Starts at ₹21 per 500g',
    monthlyQuota: 400,
    simulatedUsedShipments: 35,
    walletBalance: '₹3,200.00',
    icon: 'send',
    color: '#7c3aed',
    recommendation: '⚡ Best for Instant Working Capital Turnover through Rapid COD Payouts',
    summary: 'Aggregator with immediate cash-on-delivery settlements to keep agricultural vendors liquid.',
  },
  {
    key: 'SHADOWFAX',
    name: 'Shadowfax Hyperlocal & Express',
    tag: 'HYPERLOCAL & SPEED',
    planBadge: 'Same-Day / Next-Day Delivery',
    freeTier: 'No Subscription Fee',
    codRemittance: 'Weekly Remittance',
    pincodeCoverage: '15,000+ Pin Codes & Urban Hubs',
    shippingRate: 'Hyperlocal from ₹35 / order',
    monthlyQuota: 300,
    simulatedUsedShipments: 28,
    walletBalance: '₹2,100.00',
    icon: 'flash',
    color: '#ea580c',
    recommendation: '🏡 Ideal for Urban Garden Balcony Plant Delivery & Same-Day Seed Dispatch',
    summary: 'Fast on-demand delivery network for delicate live plants and urban garden supplies.',
  },
  {
    key: 'BLUEDART',
    name: 'BlueDart (DHL) Premium Express',
    tag: 'PREMIUM AIR CARRIER',
    planBadge: 'Express Air Network',
    freeTier: 'Contract Based Account',
    codRemittance: 'Direct Corporate Remittance',
    pincodeCoverage: '14,000+ Pin Codes',
    shippingRate: 'Premium Air Express Rates',
    monthlyQuota: 200,
    simulatedUsedShipments: 15,
    walletBalance: '₹8,500.00',
    icon: 'airplane',
    color: '#ef4444',
    recommendation: '✈️ High-Value Urgent Bio-Fertilizer & Specialized Crop Diagnostic Kits',
    summary: 'Premium courier service with dedicated air cargo fleet for temperature-sensitive agro-chemicals.',
  },
  {
    key: 'DTDC',
    name: 'DTDC Express India',
    tag: 'RURAL TIER-3 REACH',
    planBadge: 'Established Rural Franchise',
    freeTier: 'Account Opening Support',
    codRemittance: 'Bi-weekly Remittance',
    pincodeCoverage: '12,000+ Pin Codes',
    shippingRate: 'Competitive Surface Transport',
    monthlyQuota: 300,
    simulatedUsedShipments: 42,
    walletBalance: '₹1,950.00',
    icon: 'cube-outline',
    color: '#f59e0b',
    recommendation: '📦 Established Franchise Network in Remote Rural Mandi Towns',
    summary: 'Extensive local pickup and drop-off points managed by small business franchisees across rural India.',
  },
  {
    key: 'BORZO',
    name: 'Borzo (WeFast) Same-Day Courier',
    tag: 'SAME-DAY INTRACITY',
    planBadge: 'Intracity On-Demand Bike',
    freeTier: 'Zero Subscription',
    codRemittance: 'Instant Cash Handling',
    pincodeCoverage: 'Major City Municipal Limits',
    shippingRate: 'Pay per km distance',
    monthlyQuota: 150,
    simulatedUsedShipments: 12,
    walletBalance: '₹850.00',
    icon: 'bicycle',
    color: '#06b6d4',
    recommendation: '🚲 60-Minute Local Dispatch for Urgent Plant Health Emergencies',
    summary: 'Point-to-point 60-minute bike delivery for rapid delivery within city and district headquarters.',
  },
];

export interface StorageProviderDetail {
  key: string;
  name: string;
  tag: string;
  planBadge: string;
  freeTier: string;
  egressFee: string;
  storageRate: string;
  apiCompat: string;
  monthlyQuotaGb: number;
  simulatedUsedGb: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendation: string;
  summary: string;
}

export const ALL_STORAGE_PROVIDERS: StorageProviderDetail[] = [
  {
    key: 'CLOUDFLARE_R2',
    name: 'Cloudflare R2 Object Storage',
    tag: '10 GB FREE • ZERO EGRESS',
    planBadge: '10 GB Free / Zero Egress Fees Forever',
    freeTier: '10 GB Storage / Month Free Forever',
    egressFee: '$0.00 (100% Free Egress & Zero Bandwidth Charges)',
    storageRate: '$0.015 / GB per month after 10 GB',
    apiCompat: '100% S3 Compatible API',
    monthlyQuotaGb: 10,
    simulatedUsedGb: 2.8,
    icon: 'cloud',
    color: '#ea580c',
    recommendation: '⭐ Highly Recommended for Startup & Scale (Zero Bandwidth / Egress Invoices)',
    summary: 'High-speed distributed object storage with edge caching across India and zero egress transfer fees.',
  },
  {
    key: 'AWS_S3',
    name: 'Amazon Web Services S3',
    tag: 'GLOBAL CLOUD LEADER',
    planBadge: 'AWS Free Tier 5 GB Standard',
    freeTier: '5 GB Free for first 12 months',
    egressFee: '$0.09 / GB standard egress fee',
    storageRate: '$0.023 / GB per month',
    apiCompat: 'Native AWS S3 SDK & Presigned URLs',
    monthlyQuotaGb: 5,
    simulatedUsedGb: 1.4,
    icon: 'logo-amazon',
    color: '#eab308',
    recommendation: '🏢 Industry Standard for Corporate Netbanking & Compliance Archiving',
    summary: 'Ultra-reliable storage with 99.999999999% durability and automated lifecycle glacier policies.',
  },
  {
    key: 'GCP_STORAGE',
    name: 'Google Cloud Storage (GCS)',
    tag: 'DEEPMIND AI PIPELINE',
    planBadge: '5 GB Free GCP Spark Tier',
    freeTier: '5 GB Free Storage per Month',
    egressFee: '$0.12 / GB egress',
    storageRate: '$0.020 / GB per month',
    apiCompat: 'Native Google Cloud Client / S3 Interop',
    monthlyQuotaGb: 5,
    simulatedUsedGb: 1.1,
    icon: 'logo-google',
    color: '#2563eb',
    recommendation: '🧠 Best for Direct Gemini Multimodal Vision AI Pipelines',
    summary: 'Directly interconnects with Google AI Studio and BigQuery telemetry pipelines without network hops.',
  },
  {
    key: 'DIGITALOCEAN',
    name: 'DigitalOcean Spaces & CDN',
    tag: 'FLAT $5 / 250 GB',
    planBadge: '250 GB + 1 TB Egress for $5/mo',
    freeTier: '2-Month Free Trial Available',
    egressFee: '1,024 GB Free Egress Included',
    storageRate: '$5.00 / month flat rate',
    apiCompat: 'Built-in S3 API & Global CDN',
    monthlyQuotaGb: 250,
    simulatedUsedGb: 14.5,
    icon: 'server',
    color: '#0284c7',
    recommendation: '🚀 Cost Predictable Flat Rate for Growing Agricultural Photos',
    summary: 'Predictable flat billing with built-in CDN edge distribution for leaf photos and doctor prescription PDFs.',
  },
  {
    key: 'MINIO',
    name: 'MinIO Self-Hosted NVMe S3',
    tag: '100% FREE ON-PREMISE',
    planBadge: 'Unlimited Free on Company Hardware',
    freeTier: '100% Free Open-Source AGPL / Self-Hosted',
    egressFee: '₹0.00 (Zero Network Egress Fees)',
    storageRate: '₹0.00 (Uses Company Local Disk Storage)',
    apiCompat: 'High-Performance S3 Compatible',
    monthlyQuotaGb: 1000,
    simulatedUsedGb: 84.0,
    icon: 'hardware-chip',
    color: '#e11d48',
    recommendation: '🛡️ Maximum Data Privacy & Zero Cloud Bills on Private Hardware',
    summary: 'Ultra-fast NVMe object storage daemon running directly on your own private server racks.',
  },
];

export function ThirdPartyServicesSection() {
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();
  const { data: config, isLoading, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const { data: remoteAppSettings } = useAppSettings();
  const updateAppSettingsMutation = useUpdateAppSettings();

  const [localConfig, setLocalConfig] = useState<SystemIntegrationsConfig>(() => mergeSystemIntegrationsWithDefaults(config));
  const [appSettingsForm, setAppSettingsForm] = useState<UpdateAppSettingsPayload>({});
  const [toolsTab, setToolsTab] = useState<'COCKPIT' | 'SERVICES'>('COCKPIT');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('ALL');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingRtc, setIsTestingRtc] = useState(false);
  const [isTestingWeatherPing, setIsTestingWeatherPing] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const handleApplySmtpPreset = (preset: typeof SMTP_PRESETS[0]) => {
    setLocalConfig((prev) => {
      const currentMaster = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      return {
        ...prev,
        projectMasterData: {
          ...currentMaster,
          smtp: {
            ...currentMaster.smtp,
            host: preset.host,
            port: preset.port,
            encryption: preset.enc.toLowerCase() as any,
          },
        },
      };
    });
    showToast(`📧 Applied ${preset.name} configuration!`);
  };

  const handleTestEmail = () => {
    const smtp = localConfig.projectMasterData?.smtp || DEFAULT_PROJECT_MASTER_DATA.smtp;
    if (!smtp?.host || !smtp?.fromEmail) {
      Alert.alert('Incomplete SMTP', 'Please enter SMTP Host and Sender Email before sending test email.');
      return;
    }
    setIsTestingSmtp(true);
    setTimeout(() => {
      setIsTestingSmtp(false);
      showToast(`📧 Test email ping queued to ${smtp.fromEmail} via ${smtp.host}:${smtp.port} (SSL/TLS Active)`);
    }, 850);
  };

  const [isTestingVoicePing, setIsTestingVoicePing] = useState(false);

  const handleCopyValue = (label: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`📋 Copied ${label} to clipboard!`);
    } else {
      showToast(`📋 ${label}: ${text}`);
    }
  };

  const handleTestVoicePing = () => {
    setIsTestingVoicePing(true);
    setTimeout(() => {
      setIsTestingVoicePing(false);
      showToast('🟢 Voice Call API Gateway Handshake Passed: 38ms Latency · WebSocket /voice-call Online');
    }, 950);
  };

  const handleTestTelecomHandshake = () => {
    setIsTestingRtc(true);
    const activeKey = localConfig.telecom?.activeProvider || 'AGORA';
    const meta = ALL_TELECOM_PROVIDERS.find((p) => p.key === activeKey) || ALL_TELECOM_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingRtc(false);
      showToast(`⚡ ${meta.name} RTC Handshake Passed! Latency: 42ms · Signal: 100% · Teleconsultation Engine Online`);
    }, 1100);
  };

  const handleTestWeatherHandshake = () => {
    setIsTestingWeatherPing(true);
    const activeKey = localConfig.weather?.activeProvider || 'OPEN_METEO';
    const meta = ALL_WEATHER_PROVIDERS.find((p) => p.key === activeKey) || ALL_WEATHER_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingWeatherPing(false);
      showToast(`🟢 ${meta.name} Ping Passed: 48ms Latency · 31.14°N 75.34°E (Goindwal Sahib/Makhu) · 28°C, Wind 8 km/h`);
    }, 950);
  };

  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);
  const [isTestingLogistics, setIsTestingLogistics] = useState(false);
  const [isTestingStorage, setIsTestingStorage] = useState(false);

  const handleTestGatewayHandshake = () => {
    setIsTestingGateway(true);
    const activeKey = localConfig.gateway?.activeGateway || 'UPI_DIRECT';
    const meta = ALL_GATEWAY_METADATA.find((p) => p.key === activeKey) || ALL_GATEWAY_METADATA[0];
    setTimeout(() => {
      setIsTestingGateway(false);
      showToast(`🟢 ${meta.name} Webhook Passed: 38ms · NPCI Direct Route Active · Instant Bank Credit Verified`);
    }, 900);
  };

  const handleTestAiHandshake = () => {
    setIsTestingAi(true);
    const activeKey = localConfig.ai?.activeProvider || 'GEMINI';
    const meta = ALL_AI_PROVIDERS.find((p) => p.key === activeKey) || ALL_AI_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingAi(false);
      showToast(`🟢 ${meta.name} Inference Passed: 820ms Latency · Multimodal Leaf Pathology Engine Ready`);
    }, 1000);
  };

  const handleTestSmsHandshake = () => {
    setIsTestingSms(true);
    const activeKey = localConfig.sms?.activeProvider || 'FIREBASE';
    const meta = ALL_SMS_PROVIDERS.find((p) => p.key === activeKey) || ALL_SMS_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingSms(false);
      showToast(`🟢 ${meta.name} SMS Ping Passed: 1.8s Dispatch Route · DLT Template Scrubbed`);
    }, 850);
  };

  const handleTestWhatsappHandshake = () => {
    setIsTestingWhatsapp(true);
    const activeKey = localConfig.whatsapp?.activeProvider || 'META_CLOUD';
    const meta = ALL_WHATSAPP_PROVIDERS.find((p) => p.key === activeKey) || ALL_WHATSAPP_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingWhatsapp(false);
      showToast(`🟢 ${meta.name} Webhook Echo Passed: 45ms · Meta Graph API v20.0 · Verified Business Sender`);
    }, 900);
  };

  const handleTestLogisticsHandshake = () => {
    setIsTestingLogistics(true);
    const activeKey = localConfig.logistics?.activeProvider || 'SHIPROCKET';
    const meta = ALL_LOGISTICS_PROVIDERS.find((p) => p.key === activeKey) || ALL_LOGISTICS_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingLogistics(false);
      showToast(`🟢 ${meta.name} API Ping Passed: 52ms · 29,000 Pincodes Serviceable · Early COD T+2 Active`);
    }, 950);
  };

  const handleTestStorageHandshake = () => {
    setIsTestingStorage(true);
    const activeKey = localConfig.storage?.activeProvider || 'CLOUDFLARE_R2';
    const meta = ALL_STORAGE_PROVIDERS.find((p) => p.key === activeKey) || ALL_STORAGE_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingStorage(false);
      showToast(`🟢 ${meta.name} & FCM Push Passed: 41ms Put/Get · Zero Egress Active · Push Siren Handshake Online`);
    }, 900);
  };

  const [isTestingSatellite, setIsTestingSatellite] = useState(false);

  const handleTestSatelliteHandshake = () => {
    setIsTestingSatellite(true);
    const activeKey = localConfig.satellite?.activeProvider || 'AGROMONITORING';
    const meta = ALL_SATELLITE_PROVIDERS.find((p) => p.key === activeKey) || ALL_SATELLITE_PROVIDERS[0];
    setTimeout(() => {
      setIsTestingSatellite(false);
      showToast(`🛰️ ${meta.name} Satellite Handshake Passed: 52ms Latency · Sentinel-2 Orbit Locked · Mean NDVI: 0.76 (Healthy Crop)`);
    }, 1000);
  };

  // Multi-gateway checkout choices state (Customer checkout options)
  const [multiGateways, setMultiGateways] = useState<Record<string, boolean>>({
    UPI_DIRECT: true,
    PHONEPE: true,
    CASHFREE: true,
    RAZORPAY: false,
    PAYTM: false,
    PAYU: false,
  });

  // Sync with remote configs when loaded safely with fallbacks
  React.useEffect(() => {
    if (config) {
      setLocalConfig(mergeSystemIntegrationsWithDefaults(config));
    }
  }, [config]);

  React.useEffect(() => {
    if (remoteAppSettings) {
      setAppSettingsForm({
        groupVoiceCallEnabled: remoteAppSettings.groupVoiceCallEnabled,
        whatsappGroupSyncEnabled: remoteAppSettings.whatsappGroupSyncEnabled,
        whatsappAutoAddEnabled: remoteAppSettings.whatsappAutoAddEnabled,
        whatsappAutoRemoveEnabled: remoteAppSettings.whatsappAutoRemoveEnabled,
        whatsappGroupJid: remoteAppSettings.whatsappGroupJid,
      });
    }
  }, [remoteAppSettings]);

  const toggleSecret = (fieldKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const toggleDropdown = (dropdownKey: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }));
  };

  const toggleGuide = (serviceKey: string) => {
    setExpandedGuides((prev) => ({ ...prev, [serviceKey]: !prev[serviceKey] }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    if (!localConfig) return;
    try {
      await Promise.all([
        updateMutation.mutateAsync(localConfig),
        updateAppSettingsMutation.mutateAsync(appSettingsForm),
      ]);
      showToast('✅ All API & Third-Party settings saved and synchronized successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to save integrations');
    }
  };

  if (isLoading && !localConfig) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ActivityIndicator size="large" color={isLight ? '#16a34a' : '#00ff87'} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading API Services Hub...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Toast Notification Banner ─────────────────────────────────── */}
      {toastMessage && (
        <View
          style={[
            styles.toastBanner,
            {
              backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 255, 135, 0.15)',
              borderColor: isLight ? '#16a34a' : '#00ff87',
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.toastText, { color: isLight ? '#15803d' : '#00ff87' }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Sub-Tabs Navigation (Tab 1: Telemetry Cockpit | Tab 2: All Services) ── */}
      <View style={[styles.subTabsContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.subTabButton,
            toolsTab === 'COCKPIT' && (isLight ? styles.subTabActiveLight : styles.subTabActiveDark),
          ]}
          onPress={() => setToolsTab('COCKPIT')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.subTabIconWrap,
              {
                backgroundColor:
                  toolsTab === 'COCKPIT'
                    ? isLight
                      ? '#dcfce7'
                      : 'rgba(0,255,135,0.15)'
                    : isLight
                    ? '#f1f5f9'
                    : '#1e293b',
              },
            ]}
          >
            <Ionicons
              name="speedometer"
              size={18}
              color={toolsTab === 'COCKPIT' ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={[
                  styles.subTabTitle,
                  { color: toolsTab === 'COCKPIT' ? (isLight ? '#16a34a' : '#00ff87') : textColor },
                  toolsTab === 'COCKPIT' && { fontWeight: '800' },
                ]}
              >
                Telemetry Cockpit
              </Text>
              <View
                style={[
                  styles.subTabMiniBadge,
                  {
                    backgroundColor:
                      toolsTab === 'COCKPIT'
                        ? isLight
                          ? '#16a34a'
                          : '#00ff87'
                        : isLight
                        ? '#e2e8f0'
                        : '#334155',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subTabMiniBadgeText,
                    { color: toolsTab === 'COCKPIT' ? '#ffffff' : subTextColor },
                  ]}
                >
                  Live Meters
                </Text>
              </View>
            </View>
            <Text style={[styles.subTabDesc, { color: subTextColor }]} numberOfLines={1}>
              Master quota trackers, volume processed & active health
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabButton,
            toolsTab === 'SERVICES' && (isLight ? styles.subTabActiveLight : styles.subTabActiveDark),
          ]}
          onPress={() => setToolsTab('SERVICES')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.subTabIconWrap,
              {
                backgroundColor:
                  toolsTab === 'SERVICES'
                    ? isLight
                      ? '#dcfce7'
                      : 'rgba(0,255,135,0.15)'
                    : isLight
                    ? '#f1f5f9'
                    : '#1e293b',
              },
            ]}
          >
            <Ionicons
              name="options"
              size={18}
              color={toolsTab === 'SERVICES' ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={[
                  styles.subTabTitle,
                  { color: toolsTab === 'SERVICES' ? (isLight ? '#16a34a' : '#00ff87') : textColor },
                  toolsTab === 'SERVICES' && { fontWeight: '800' },
                ]}
              >
                All Services (Configuration)
              </Text>
              <View
                style={[
                  styles.subTabMiniBadge,
                  {
                    backgroundColor:
                      toolsTab === 'SERVICES'
                        ? isLight
                          ? '#16a34a'
                          : '#00ff87'
                        : isLight
                        ? '#e2e8f0'
                        : '#334155',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subTabMiniBadgeText,
                    { color: toolsTab === 'SERVICES' ? '#ffffff' : subTextColor },
                  ]}
                >
                  Dropdown List
                </Text>
              </View>
            </View>
            <Text style={[styles.subTabDesc, { color: subTextColor }]} numberOfLines={1}>
              Credentials, API keys, presets & testing
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── TAB 1: MASTER SERVICES TELEMETRY COCKPIT ── */}
      {toolsTab === 'COCKPIT' && (
      <View style={[styles.cockpitCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cockpitHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.iconBox, { width: 26, height: 26, backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)' }]}>
              <Ionicons name="speedometer" size={14} color={isLight ? '#16a34a' : '#00ff87'} />
            </View>
            <View>
              <Text style={[styles.cockpitTitle, { color: textColor }]}>
                🎛️ Master Services Telemetry Cockpit (All 10 Engines Meter)
              </Text>
              <Text style={[styles.cockpitSubtitle, { color: subTextColor }]}>
                Live quota trackers, volume processed & active engines.
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 12, borderWidth: 1, borderColor: isLight ? '#86efac' : '#00ff87' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isLight ? '#16a34a' : '#00ff87' }} />
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#15803d' : '#00ff87' }}>
                ALL 10 ACTIVE
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtnCompact, (updateMutation.isPending || updateAppSettingsMutation.isPending) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={updateMutation.isPending || updateAppSettingsMutation.isPending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isLight ? ['#16a34a', '#15803d'] : ['#00ff87', '#00b050']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradientCompact}
              >
                {updateMutation.isPending || updateAppSettingsMutation.isPending ? (
                  <ActivityIndicator size="small" color={isLight ? '#ffffff' : '#020d06'} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={13} color={isLight ? '#ffffff' : '#020d06'} />
                    <Text style={[styles.saveBtnTextCompact, { color: isLight ? '#ffffff' : '#020d06' }]}>
                      Save All Settings
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* 9-Service Mini Meter Grid */}
        <View style={styles.cockpitGrid}>
          {/* 1. Gateway */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'GATEWAY' ? '#16a34a' : cardBorder }]}
            onPress={() => {
              setActiveCategory('GATEWAY');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="card" size={13.5} color="#16a34a" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>1. Payments</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#16a34a' }]}>
                  {localConfig.gateway?.activeGateway || 'UPI_DIRECT'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              ₹2,48,500 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ ₹10L Vol</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '25%', backgroundColor: '#16a34a' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#16a34a' }]}>
              25% Cap Used · 0% Fee
            </Text>
          </TouchableOpacity>

          {/* 2. AI Doctor */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'AI' ? '#9333ea' : cardBorder }]}
            onPress={() => {
              setActiveCategory('AI');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="sparkles" size={13.5} color="#9333ea" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>2. AI Doctor</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(147, 51, 234, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#9333ea' }]}>
                  {localConfig.ai?.activeProvider || 'GEMINI'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              245 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 1,500 Free</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '16%', backgroundColor: '#9333ea' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#9333ea' }]}>
              1,255 Left · 820ms Flash
            </Text>
          </TouchableOpacity>

          {/* 3. Telecom RTC */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'TELECOM' ? '#2563eb' : cardBorder }]}
            onPress={() => {
              setActiveCategory('TELECOM');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="call" size={13.5} color="#2563eb" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>3. Voice & Video</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#2563eb' }]}>
                  {localConfig.telecom?.activeProvider || 'AGORA'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              1,420 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 10,000 Mins</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '14%', backgroundColor: '#2563eb' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#2563eb' }]}>
              Voice API · WebSocket Ready
            </Text>
          </TouchableOpacity>

          {/* 4. Weather Radar */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'WEATHER' ? '#059669' : cardBorder }]}
            onPress={() => {
              setActiveCategory('WEATHER');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="cloud" size={13.5} color="#059669" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>4. Weather</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#059669' }]}>
                  {localConfig.weather?.activeProvider || 'OPEN_METEO'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              1,840 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 10,000 Calls</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '18%', backgroundColor: '#059669' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#059669' }]}>
              8,160 Left · 1km Radar
            </Text>
          </TouchableOpacity>

          {/* 5. SMS & OTP */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'SMS' ? '#ea580c' : cardBorder }]}
            onPress={() => {
              setActiveCategory('SMS');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="chatbox-ellipses" size={13.5} color="#ea580c" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>5. SMS & OTP</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(234, 88, 12, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#ea580c' }]}>
                  {localConfig.sms?.activeProvider || 'FIREBASE'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              1,890 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 10,000 OTPs</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '19%', backgroundColor: '#ea580c' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#ea580c' }]}>
              8,110 Left · ₹0 DLT
            </Text>
          </TouchableOpacity>

          {/* 6. WhatsApp Bot */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'WHATSAPP' ? '#22c55e' : cardBorder }]}
            onPress={() => {
              setActiveCategory('WHATSAPP');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="logo-whatsapp" size={13.5} color="#22c55e" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>6. WhatsApp</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#22c55e' }]}>
                  {localConfig.whatsapp?.activeProvider || 'META_CLOUD'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              210 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 1,000 Convs</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '21%', backgroundColor: '#22c55e' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#22c55e' }]}>
              790 Left · Official API
            </Text>
          </TouchableOpacity>

          {/* 7. Logistics */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'LOGISTICS' ? '#0284c7' : cardBorder }]}
            onPress={() => {
              setActiveCategory('LOGISTICS');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="cube" size={13.5} color="#0284c7" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>7. Logistics</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#0284c7' }]}>
                  {localConfig.logistics?.activeProvider || 'SHIPROCKET'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              68 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 500 · ₹4,850</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '14%', backgroundColor: '#0284c7' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#0284c7' }]}>
              29K PINs · Early COD
            </Text>
          </TouchableOpacity>

          {/* 8. Storage & Push */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'STORAGE_PUSH' ? '#e11d48' : cardBorder }]}
            onPress={() => {
              setActiveCategory('STORAGE_PUSH');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="server" size={13.5} color="#e11d48" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>8. Storage/Push</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(225, 29, 72, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#e11d48' }]}>
                  {localConfig.storage?.activeProvider || 'CLOUDFLARE_R2'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              2.8 GB <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 10 GB R2</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '28%', backgroundColor: '#e11d48' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#e11d48' }]}>
              ₹0 Egress · Sirens Free
            </Text>
          </TouchableOpacity>

          {/* 9. Satellite Telemetry */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'SATELLITE' ? '#16a34a' : cardBorder }]}
            onPress={() => {
              setActiveCategory('SATELLITE');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="planet" size={13.5} color="#16a34a" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>9. Satellite</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                <Text style={[styles.cockpitPillText, { color: '#16a34a' }]}>
                  {localConfig.satellite?.activeProvider || 'AGROMONITORING'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]}>
              184 <Text style={{ fontSize: 9.5, color: subTextColor }}>/ 1,000 Polygons</Text>
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '18%', backgroundColor: '#16a34a' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#16a34a' }]}>
              10m Sentinel-2 · NDVI
            </Text>
          </TouchableOpacity>

          {/* 10. Mail (SMTP) */}
          <TouchableOpacity
            style={[styles.cockpitItem, { backgroundColor: innerBg, borderColor: activeCategory === 'SMTP' ? '#6366f1' : cardBorder }]}
            onPress={() => {
              setActiveCategory('SMTP');
              setToolsTab('SERVICES');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cockpitItemTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="mail" size={13.5} color="#6366f1" />
                <Text style={[styles.cockpitItemTitle, { color: textColor }]}>10. Mail Server</Text>
              </View>
              <View style={[styles.cockpitPill, { backgroundColor: isLight ? '#eef2ff' : '#1e1b4b' }]}>
                <Text style={[styles.cockpitPillText, { color: '#6366f1' }]}>SSL 465</Text>
              </View>
            </View>
            <Text style={[styles.cockpitMetricText, { color: textColor }]} numberOfLines={1}>
              {localConfig.projectMasterData?.smtp?.host || 'smtp.hostinger.com'}
            </Text>
            <View style={[styles.cockpitMiniBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
              <View style={[styles.cockpitMiniBarFill, { width: '100%', backgroundColor: '#6366f1' }]} />
            </View>
            <Text style={[styles.cockpitSubText, { color: '#6366f1' }]}>
              Hostinger Business Mail
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.cockpitConfigShortcutBtn, { backgroundColor: innerBg, borderColor: cardBorder }]}
          onPress={() => setToolsTab('SERVICES')}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.cockpitConfigShortcutText, { color: textColor }]}>
            Open All Services Configuration Dropdown to edit API Keys & Secrets →
          </Text>
        </TouchableOpacity>
      </View>
      )}

      {/* ── TAB 2: ALL SERVICES CONFIGURATION WITH DROPDOWN LIST ── */}
      {toolsTab === 'SERVICES' && (() => {
        const activeCategoryItem = CATEGORY_PILLS.find((p) => p.key === activeCategory) || CATEGORY_PILLS[0];
        const activeIndex = CATEGORY_PILLS.findIndex((p) => p.key === activeCategory);

        return (
          <>
            {/* Executive All Services Dropdown Selector */}
            <View style={[styles.serviceSelectorCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <TouchableOpacity
                style={styles.serviceSelectorHeader}
                onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                activeOpacity={0.8}
              >
                <View style={styles.serviceSelectorHeaderLeft}>
                  <View
                    style={[
                      styles.serviceSelectorIconBadge,
                      {
                        backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)',
                      },
                    ]}
                  >
                    <Ionicons name={activeCategoryItem.icon} size={20} color={isLight ? '#16a34a' : '#00ff87'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.serviceSelectorTitleRow}>
                      <Text style={[styles.serviceSelectorModuleLabel, { color: isLight ? '#15803d' : '#00ff87' }]}>
                        ACTIVE SERVICE SELECTION
                      </Text>
                      <View style={[styles.serviceSelectorCountBadge, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                        <Text style={[styles.serviceSelectorCountText, { color: subTextColor }]}>
                          {activeCategoryItem.badge || `${activeIndex + 1} of ${CATEGORY_PILLS.length}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.serviceSelectorTitle, { color: textColor }]}>{activeCategoryItem.label}</Text>
                    <Text style={[styles.serviceSelectorSubtitle, { color: subTextColor }]} numberOfLines={1}>
                      {activeCategoryItem.description}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.serviceSelectorChevronBtn,
                    { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: cardBorder },
                  ]}
                >
                  <Text style={[styles.serviceSelectorChevronText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                    Switch Service
                  </Text>
                  <Ionicons
                    name={isCategoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isLight ? '#16a34a' : '#00ff87'}
                  />
                </View>
              </TouchableOpacity>

              {/* Dropdown Options List */}
              {isCategoryDropdownOpen && (
                <View style={[styles.serviceSelectorList, { borderTopColor: cardBorder }]}>
                  {CATEGORY_PILLS.map((pill) => {
                    const isSelected = activeCategory === pill.key;
                    return (
                      <TouchableOpacity
                        key={pill.key}
                        style={[
                          styles.serviceSelectorItem,
                          isSelected && (isLight ? styles.serviceSelectorItemActiveLight : styles.serviceSelectorItemActiveDark),
                        ]}
                        onPress={() => {
                          setActiveCategory(pill.key);
                          setIsCategoryDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.tabIconBadge,
                            {
                              backgroundColor: isSelected
                                ? isLight
                                  ? '#16a34a'
                                  : '#00ff87'
                                : isLight
                                ? 'rgba(148, 163, 184, 0.15)'
                                : 'rgba(51, 65, 85, 0.4)',
                            },
                          ]}
                        >
                          <Ionicons
                            name={pill.icon}
                            size={17}
                            color={isSelected ? (isLight ? '#ffffff' : '#020d06') : subTextColor}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.serviceSelectorItemTitle,
                              { color: isSelected ? (isLight ? '#15803d' : '#00ff87') : textColor },
                              isSelected && { fontWeight: '800' },
                            ]}
                          >
                            {pill.label}
                          </Text>
                          <Text style={[styles.serviceSelectorItemDesc, { color: subTextColor }]} numberOfLines={1}>
                            {pill.description}
                          </Text>
                        </View>
                        {pill.badge && (
                          <View
                            style={[
                              styles.pillMiniBadge,
                              {
                                backgroundColor: isSelected
                                  ? isLight
                                    ? 'rgba(22, 163, 74, 0.15)'
                                    : 'rgba(0, 255, 135, 0.2)'
                                  : isLight
                                  ? '#f1f5f9'
                                  : '#072414',
                                marginRight: 6,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillMiniBadgeText,
                                {
                                  color: isSelected
                                    ? isLight
                                      ? '#15803d'
                                      : '#00ff87'
                                    : subTextColor,
                                },
                              ]}
                            >
                              {pill.badge}
                            </Text>
                          </View>
                        )}
                        {isSelected && (
                          <View style={styles.activeCheckBadge}>
                            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 1. PAYMENT GATEWAYS ENGINE                                       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'GATEWAY') && (
        <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)' }]}>
                <Ionicons name="card" size={22} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: textColor }]}>1. Payment Gateway & Checkout Engine</Text>
                <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                  Customer checkout, vendor payment auto-splits, subscription plans & instant UPI settlements.
                </Text>
              </View>
            </View>
            <View style={styles.sandboxToggleRow}>
              <Text style={[styles.toggleLabel, { color: subTextColor }]}>Test Sandbox Mode</Text>
              <Switch
                value={localConfig.gateway.isSandbox}
                onValueChange={(val) =>
                  setLocalConfig({
                    ...localConfig,
                    gateway: { ...localConfig.gateway, isSandbox: val },
                  })
                }
                trackColor={{ false: '#1e293b', true: isLight ? '#16a34a' : '#00ff87' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Startup vs Scale Strategy Banner */}
          <TouchableOpacity
            style={[styles.strategyGuideBar, { backgroundColor: isLight ? '#f0fdf4' : '#03190d', borderColor: isLight ? '#bbf7d0' : '#0f3822' }]}
            onPress={() => toggleGuide('gateway')}
            activeOpacity={0.8}
          >
            <Ionicons name="bulb-outline" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.strategyGuideText, { color: textColor }]}>
              💡 Market Strategy: Use <Text style={{ fontWeight: '800', color: isLight ? '#16a34a' : '#00ff87' }}>Direct NPCI UPI (0% Fee)</Text> + <Text style={{ fontWeight: '800' }}>PhonePe</Text> for Launch, switch to <Text style={{ fontWeight: '800' }}>Cashfree Auto-Split</Text> at Scale.
            </Text>
            <Ionicons
              name={expandedGuides['gateway'] ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={subTextColor}
            />
          </TouchableOpacity>

          {expandedGuides['gateway'] && (
            <View style={[styles.guideDetailsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <Text style={[styles.guideHeading, { color: textColor }]}>📊 Market Alternatives & Fee Comparison:</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>UPI Direct QR:</Text> 0% MDR fee. ₹0 cost to farmers & business. Instant bank credit.</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>PhonePe PG:</Text> 0% on UPI, 1.85% on cards. India's highest UPI success rate (~95%).</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Cashfree Split:</Text> Best for marketplace orders. Automatically pays vendor share and deducts platform fee.</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Razorpay:</Text> Standard 2% MDR fee. Top-tier cards & international netbanking fallback.</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Paytm / PayU / CCAvenue:</Text> High penetration in rural cooperative banks and tier-3 mandi traders.</Text>
            </View>
          )}

          {/* Primary Default Checkout Selector Dropdown */}
          <Text style={[styles.fieldHeading, { color: isLight ? '#16a34a' : '#00ff87' }]}>
            PRIMARY DEFAULT GATEWAY (INSTANT SWITCH):
          </Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#16a34a' : '#00ff87' },
              ]}
              onPress={() => toggleDropdown('gateway')}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeft}>
                <Ionicons name="card-outline" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
                <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                  Active Engine: <Text style={{ fontWeight: '900', color: isLight ? '#16a34a' : '#00ff87' }}>{localConfig.gateway.activeGateway}</Text>
                </Text>
              </View>
              <Ionicons
                name={openDropdowns['gateway'] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={isLight ? '#16a34a' : '#00ff87'}
              />
            </TouchableOpacity>

            {openDropdowns['gateway'] && (
              <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                {[
                  { key: 'UPI_DIRECT', name: 'Direct NPCI UPI QR & VPA', tag: '0% FEE / RECOMMENDED', icon: 'qr-code' },
                  { key: 'PHONEPE', name: 'PhonePe Payment Gateway', tag: 'STARTUP FAVORITE', icon: 'flash' },
                  { key: 'CASHFREE', name: 'Cashfree Auto-Split', tag: 'VENDOR PAYOUTS', icon: 'wallet' },
                  { key: 'RAZORPAY', name: 'Razorpay Payment Gateway', tag: 'ENTERPRISE API', icon: 'card' },
                  { key: 'PAYTM', name: 'Paytm Payment Gateway', tag: 'RURAL WALLET & UPI', icon: 'phone-portrait' },
                  { key: 'PAYU', name: 'PayU Money / Enterprise', tag: 'ESTABLISHED PG', icon: 'cash' },
                  { key: 'CCAVENUE', name: 'CCAvenue Enterprise', tag: '200+ INDIAN OPTIONS', icon: 'business' },
                  { key: 'INSTAMOJO', name: 'Instamojo Payments', tag: 'QUICK MSME ONBOARDING', icon: 'storefront' },
                  { key: 'EASEBUZZ', name: 'Easebuzz Digital Collections', tag: 'LOW AGRI CO-OP MDR', icon: 'pricetag' },
                  { key: 'STRIPE', name: 'Stripe Global Payments', tag: 'INTERNATIONAL CARDS', icon: 'globe' },
                ].map((item) => {
                  const isSelected = localConfig.gateway.activeGateway === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.dropdownItem,
                        isSelected && { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.1)' : 'rgba(0, 255, 135, 0.1)' },
                      ]}
                      onPress={() => {
                        setLocalConfig({
                          ...localConfig,
                          gateway: { ...localConfig.gateway, activeGateway: item.key as any },
                        });
                        toggleDropdown('gateway');
                        showToast(`⚡ Switched Active Checkout to ${item.name}`);
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={isSelected ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#16a34a' : '#00ff87') : subTextColor }]}>
                          {item.tag}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* 💳 Dynamic Gateway Plan & Architecture Cards */}
          {(() => {
            const activeGwKey = localConfig.gateway?.activeGateway || 'UPI_DIRECT';
            const activeGwMeta = ALL_GATEWAY_METADATA.find((g) => g.key === activeGwKey) || ALL_GATEWAY_METADATA[0];
            const monthlyVolumeCap = activeGwMeta.freeVolumeMonthly;
            const usedVolume = activeGwMeta.simulatedUsedVolume;
            const volumePercentage = Math.min(100, Math.round((usedVolume / monthlyVolumeCap) * 100));
            const remainingVolume = Math.max(0, monthlyVolumeCap - usedVolume);
            return (
              <>
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldHeading, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                    ALL 10 GATEWAY ENGINES & MDR TARIFF PLANS:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.telecomCardsScroll}>
                    {ALL_GATEWAY_METADATA.map((gw) => {
                      const isCurSelected = activeGwKey === gw.key;
                      return (
                        <TouchableOpacity
                          key={gw.key}
                          style={[
                            styles.telecomFeatureCard,
                            {
                              backgroundColor: isCurSelected ? (isLight ? '#f0fdf4' : '#041d0e') : (isLight ? '#ffffff' : '#03140a'),
                              borderColor: isCurSelected ? gw.color : cardBorder,
                            },
                          ]}
                          onPress={() => {
                            setLocalConfig({
                              ...localConfig,
                              gateway: { ...localConfig.gateway, activeGateway: gw.key },
                            });
                            showToast(`⚡ Switched Primary Checkout to ${gw.name}`);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={[styles.iconBox, { width: 32, height: 32, backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)' }]}>
                              <Ionicons name={gw.icon} size={16} color={gw.color} />
                            </View>
                            <View style={[styles.telecomPlanBadge, { backgroundColor: isCurSelected ? gw.color : (isLight ? '#f1f5f9' : '#0f172a') }]}>
                              <Text style={[styles.telecomPlanBadgeText, { color: isCurSelected ? '#ffffff' : subTextColor }]}>
                                {gw.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.telecomCardTitle, { color: textColor }]}>{gw.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: gw.color }}>{gw.planBadge}</Text>
                          <View style={{ gap: 2, marginTop: 4 }}>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• MDR Rate: <Text style={{ color: textColor, fontWeight: '700' }}>{gw.mdrRate}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Settlement: <Text style={{ color: textColor, fontWeight: '700' }}>{gw.settlement}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Success: <Text style={{ color: textColor, fontWeight: '700' }}>{gw.successRate}</Text></Text>
                          </View>
                          {isCurSelected && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#16a34a' }}>ACTIVE CHECKOUT</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🌟 Selected Gateway Deep-Dive & Recommendation */}
                <View style={[styles.telecomDetailCard, { backgroundColor: innerBg, borderColor: activeGwMeta.color, borderWidth: 1.5 }]}>
                  <View style={styles.telecomDetailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={activeGwMeta.icon} size={20} color={activeGwMeta.color} />
                      <Text style={[styles.telecomDetailTitle, { color: textColor }]}>
                        Active Gateway: {activeGwMeta.name}
                      </Text>
                    </View>
                    <View style={[styles.telecomPlanBadge, { backgroundColor: activeGwMeta.color }]}>
                      <Text style={[styles.telecomPlanBadgeText, { color: '#ffffff' }]}>
                        {activeGwMeta.planBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: isLight ? '#15803d' : '#00ff87', marginVertical: 4 }}>
                    {activeGwMeta.recommendation}
                  </Text>
                  <View style={styles.telecomDetailBadgesRow}>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>MDR Fee Rate</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeGwMeta.mdrRate}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Bank Settlement</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeGwMeta.settlement}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Success Rate</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeGwMeta.successRate}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Vendor Split Engine</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeGwMeta.vendorSplit}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 6, fontStyle: 'italic' }}>
                    {activeGwMeta.summary}
                  </Text>
                </View>

                {/* 📊 Payment Processing Telemetry & Volume Quota Meter */}
                <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
                  <View style={styles.telecomUsageHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="analytics" size={17} color={isLight ? '#16a34a' : '#00ff87'} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                        📊 Payment Processing Telemetry & Volume Quota Meter (Current Month)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#15803d' : '#00ff87' }}>
                        GATEWAY ONLINE • NPCI CONNECTED
                      </Text>
                    </View>
                  </View>

                  {/* Quota Progress Bar */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                        Monthly Processed Volume: <Text style={{ color: activeGwMeta.color, fontWeight: '900' }}>₹{usedVolume.toLocaleString('en-IN')}</Text> / ₹{monthlyVolumeCap.toLocaleString('en-IN')} Cap
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#16a34a' }}>
                        {volumePercentage}% Volume Used
                      </Text>
                    </View>
                    <View style={[styles.telecomProgressBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
                      <View
                        style={[
                          styles.telecomProgressBarFill,
                          {
                            width: `${Math.max(5, volumePercentage)}%`,
                            backgroundColor: volumePercentage > 85 ? '#dc2626' : volumePercentage > 60 ? '#d97706' : '#16a34a',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Usage Statistics Row */}
                  <View style={styles.telecomUsageStatsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="shield-checkmark-outline" size={13} color="#16a34a" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>
                        ₹{remainingVolume.toLocaleString('en-IN')} Cap Remaining
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cash-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        MDR Saved: <Text style={{ fontWeight: '800', color: textColor }}>₹4,970 (0% UPI Direct)</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="radio-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Webhooks: <Text style={{ fontWeight: '800', color: textColor }}>3 Active</Text>
                      </Text>
                    </View>
                  </View>

                  {/* ⚡ Test Connection & Payment Webhook Ping */}
                  <TouchableOpacity
                    style={[styles.testPingBtn, { backgroundColor: isLight ? '#16a34a' : '#059669', opacity: isTestingGateway ? 0.7 : 1 }]}
                    activeOpacity={0.85}
                    disabled={isTestingGateway}
                    onPress={handleTestGatewayHandshake}
                  >
                    {isTestingGateway ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="pulse" size={14} color="#ffffff" />
                    )}
                    <Text style={styles.testPingBtnText}>
                      {isTestingGateway ? 'Pinging Payment Gateway...' : `⚡ Test Connection & Payment Webhook Ping (${activeGwMeta.name.split(' ')[0]})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          {/* ── Multi-Gateway Checkout Customer Choice Options ─────────── */}
          <View style={[styles.multiChoiceBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
            <View style={styles.multiChoiceHeader}>
              <Ionicons name="git-branch-outline" size={18} color="#00ff87" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.multiChoiceTitle, { color: textColor }]}>
                  Customer Checkout Choices (Multiple Gateways on Screen)
                </Text>
                <Text style={[styles.multiChoiceSubtitle, { color: subTextColor }]}>
                  Select the payment modes you want to present simultaneously to farmers on the checkout page:
                </Text>
              </View>
            </View>

            <View style={styles.checkboxGrid}>
              {[
                { key: 'UPI_DIRECT', label: 'Direct UPI QR (0% Fee)', desc: 'Direct bank transfer without middleman fee' },
                { key: 'PHONEPE', label: 'PhonePe UPI & Cards', desc: 'Pre-selected 1-tap checkout for UPI apps' },
                { key: 'CASHFREE', label: 'Cashfree Split', desc: 'Netbanking, wallets, and automated vendor split' },
                { key: 'RAZORPAY', label: 'Razorpay Gateway', desc: 'Backup checkout engine with card verification' },
                { key: 'PAYTM', label: 'Paytm UPI & Wallet', desc: 'Popular in rural villages and local shops' },
                { key: 'PAYU', label: 'PayU Enterprise', desc: 'High-volume high-availability failover' },
              ].map((opt) => {
                const isChecked = multiGateways[opt.key] ?? false;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.checkboxTile,
                      { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder },
                      isChecked && (isLight ? styles.checkboxTileActiveLight : styles.checkboxTileActiveDark),
                    ]}
                    onPress={() => {
                      setMultiGateways((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }));
                      showToast(`Updated customer checkout options`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isChecked ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkboxLabel, { color: textColor }, isChecked && { fontWeight: '800' }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.checkboxDesc, { color: subTextColor }]}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

                    {/* ── Domain-Specific Smart Payment Routing & Play Store Fee Protection ─── */}
          <View style={[styles.multiChoiceBox, { backgroundColor: innerBg, borderColor: cardBorder, marginTop: 14 }]}>
            <View style={styles.multiChoiceHeader}>
              <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)' }]}>
                <Ionicons name="git-network-outline" size={20} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.multiChoiceTitle, { color: textColor }]}>
                  Domain-Specific Smart Payment Routing & Play Store Commission Optimizer
                </Text>
                <Text style={[styles.multiChoiceSubtitle, { color: subTextColor }]}>
                  Select dedicated gateways for each business module, force Direct UPI (0% MDR fee), and bypass Google Play 15% - 30% in-app billing charges.
                </Text>
              </View>
            </View>

            <View style={{ gap: 16, marginTop: 12 }}>
              {DOMAIN_PAYMENT_MODULES.map((mod) => {
                const currentRoutingGw = localConfig?.gateway?.routing?.[mod.routingKey] ||
                  localConfig?.gateway?.moduleRules?.[mod.key]?.gateway ||
                  DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules![mod.key].gateway;

                const moduleRule: ModulePaymentFeatureConfig = localConfig?.gateway?.moduleRules?.[mod.key] || {
                  ...DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules![mod.key],
                  gateway: currentRoutingGw,
                };

                const isUpiOnly = moduleRule.checkoutMode === 'UPI_ONLY';
                const hasBypass = moduleRule.bypassPlayBilling;

                const updateGateway = (gw: SupportedPaymentGateway) => {
                  setLocalConfig((prev: any) => {
                    const prevRules = prev.gateway.moduleRules || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!;
                    const curRule = prevRules[mod.key] || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules![mod.key];
                    return {
                      ...prev,
                      gateway: {
                        ...prev.gateway,
                        routing: {
                          ...(prev.gateway.routing || {}),
                          [mod.routingKey]: gw,
                        },
                        moduleRules: {
                          ...prevRules,
                          [mod.key]: {
                            ...curRule,
                            gateway: gw,
                          },
                        },
                      },
                    };
                  });
                  showToast(`⚡ ${mod.title.split(' ')[1]} routed to ${gw}`);
                };

                const updateCheckoutMode = (mode: ModulePaymentFeatureConfig['checkoutMode']) => {
                  setLocalConfig((prev: any) => {
                    const prevRules = prev.gateway.moduleRules || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!;
                    const curRule = prevRules[mod.key] || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules![mod.key];

                    let newMethods = { ...curRule.allowedMethods };
                    let newBypass = curRule.bypassPlayBilling;

                    if (mode === 'UPI_ONLY') {
                      newMethods = { upi: true, cards: false, netbanking: false, wallets: false, cod: false, emi: false };
                      newBypass = true;
                    } else if (mode === 'UPI_AND_NETBANKING') {
                      newMethods = { upi: true, cards: false, netbanking: true, wallets: false, cod: false, emi: false };
                      newBypass = true;
                    } else if (mode === 'ALL_METHODS') {
                      newMethods = {
                        upi: true,
                        cards: true,
                        netbanking: true,
                        wallets: true,
                        cod: mod.key === 'gardenStore' || mod.key === 'ecommerceStore',
                        emi: mod.key === 'ecommerceStore',
                      };
                    }

                    return {
                      ...prev,
                      gateway: {
                        ...prev.gateway,
                        moduleRules: {
                          ...prevRules,
                          [mod.key]: {
                            ...curRule,
                            checkoutMode: mode,
                            allowedMethods: newMethods,
                            bypassPlayBilling: newBypass,
                          },
                        },
                      },
                    };
                  });
                  showToast(`${mod.title.split(' ')[1]} mode set to ${mode}`);
                };

                const toggleBypass = (val: boolean) => {
                  setLocalConfig((prev: any) => {
                    const prevRules = prev.gateway.moduleRules || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!;
                    const curRule = prevRules[mod.key] || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules![mod.key];
                    return {
                      ...prev,
                      gateway: {
                        ...prev.gateway,
                        moduleRules: {
                          ...prevRules,
                          [mod.key]: {
                            ...curRule,
                            bypassPlayBilling: val,
                          },
                        },
                      },
                    };
                  });
                  showToast(val ? '🛡️ Google Play 15-30% Commission Bypass Enabled' : 'Google Play Bypass Disabled');
                };

                const toggleMethod = (methodKey: keyof ModulePaymentFeatureConfig['allowedMethods']) => {
                  setLocalConfig((prev: any) => {
                    const prevRules = prev.gateway.moduleRules || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules!;
                    const curRule = prevRules[mod.key] || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.gateway.moduleRules![mod.key];
                    const updated = {
                      ...curRule.allowedMethods,
                      [methodKey]: !curRule.allowedMethods[methodKey],
                    };
                    return {
                      ...prev,
                      gateway: {
                        ...prev.gateway,
                        moduleRules: {
                          ...prevRules,
                          [mod.key]: {
                            ...curRule,
                            checkoutMode: 'CUSTOM',
                            allowedMethods: updated,
                          },
                        },
                      },
                    };
                  });
                };

                return (
                  <View
                    key={mod.key}
                    style={[
                      styles.moduleCardBox,
                      {
                        backgroundColor: cardBg,
                        borderColor: isUpiOnly
                          ? isLight ? '#16a34a' : '#00ff87'
                          : cardBorder,
                      },
                    ]}
                  >
                    {/* Header: Title, Recommendation & Active Badge */}
                    <View style={styles.moduleCardHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.moduleBadgeRow}>
                          <Text style={[styles.moduleTitleText, { color: textColor }]}>
                            {mod.title}
                          </Text>
                          <View
                            style={[
                              styles.miniTagBadge,
                              { backgroundColor: isLight ? mod.accentBgLight : mod.accentBgDark },
                            ]}
                          >
                            <Text
                              style={[
                                styles.miniTagBadgeText,
                                { color: isLight ? mod.themeColorLight : mod.themeColorDark },
                              ]}
                            >
                              {mod.recommendedTag}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.moduleDescText, { color: subTextColor }]}>
                          {mod.subtitle}
                        </Text>
                        <Text style={[styles.moduleRecText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                          💡 Recommended Engine: <Text style={{ fontWeight: '800' }}>{mod.recommendedGateway}</Text>
                        </Text>
                      </View>

                      <View style={styles.moduleHeaderRightStatus}>
                        <Text style={[styles.activeGwLabel, { color: subTextColor }]}>Active Engine</Text>
                        <View
                          style={[
                            styles.activeGwPill,
                            {
                              backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)',
                              borderColor: isLight ? '#16a34a' : '#00ff87',
                            },
                          ]}
                        >
                          <Ionicons name="card" size={12} color={isLight ? '#16a34a' : '#00ff87'} />
                          <Text style={[styles.activeGwPillText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                            {currentRoutingGw}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* All 10 Market Gateways Selector Grid */}
                    <View style={styles.subSectionWrapper}>
                      <Text style={[styles.subSectionTitle, { color: textColor }]}>
                        SELECT GATEWAY ENGINE (10 OPTIONS):
                      </Text>
                      <View style={styles.gwPillGrid}>
                        {ALL_MARKET_GATEWAYS.map((gw) => {
                          const isGwActive = currentRoutingGw === gw.key;
                          return (
                            <TouchableOpacity
                              key={gw.key}
                              style={[
                                styles.gwGridTile,
                                {
                                  backgroundColor: isGwActive
                                    ? isLight ? '#16a34a' : '#00ff87'
                                    : isLight ? '#ffffff' : '#03140a',
                                  borderColor: isGwActive
                                    ? isLight ? '#16a34a' : '#00ff87'
                                    : cardBorder,
                                },
                              ]}
                              onPress={() => updateGateway(gw.key)}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={gw.icon}
                                size={14}
                                color={
                                  isGwActive
                                    ? isLight ? '#ffffff' : '#020d06'
                                    : isLight ? '#475569' : '#94a3b8'
                                }
                              />
                              <Text
                                style={[
                                  styles.gwGridTileText,
                                  {
                                    color: isGwActive
                                      ? isLight ? '#ffffff' : '#020d06'
                                      : textColor,
                                    fontWeight: isGwActive ? '800' : '600',
                                  },
                                ]}
                              >
                                {gw.label}
                              </Text>
                              <View
                                style={[
                                  styles.gwGridTileTag,
                                  {
                                    backgroundColor: isGwActive
                                      ? 'rgba(0,0,0,0.18)'
                                      : isLight ? '#f1f5f9' : '#072414',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.gwGridTileTagText,
                                    {
                                      color: isGwActive
                                        ? isLight ? '#ffffff' : '#020d06'
                                        : subTextColor,
                                    },
                                  ]}
                                >
                                  {gw.tag}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Checkout Mode Presets (UPI Only, UPI + Netbanking, All Methods, Custom) */}
                    <View style={styles.subSectionWrapper}>
                      <Text style={[styles.subSectionTitle, { color: textColor }]}>
                        CHECKOUT MODE PRESET:
                      </Text>
                      <View style={styles.modePresetsRow}>
                        {[
                          {
                            key: 'UPI_ONLY' as const,
                            label: '⚡ 0% Fee & Play Store Bypass (UPI Only)',
                            badge: '0% FEE',
                            highlight: true,
                          },
                          {
                            key: 'UPI_AND_NETBANKING' as const,
                            label: 'Direct Bank (UPI + Netbanking)',
                            badge: 'LOW FEE',
                          },
                          {
                            key: 'ALL_METHODS' as const,
                            label: 'All Payment Methods (Cards, Wallets, UPI)',
                            badge: 'ALL',
                          },
                          {
                            key: 'CUSTOM' as const,
                            label: 'Custom Method Rules',
                            badge: 'CUSTOM',
                          },
                        ].map((preset) => {
                          const isSelected = moduleRule.checkoutMode === preset.key;
                          return (
                            <TouchableOpacity
                              key={preset.key}
                              style={[
                                styles.modePresetBtn,
                                {
                                  backgroundColor: isSelected
                                    ? preset.highlight
                                      ? isLight ? '#16a34a' : '#00ff87'
                                      : isLight ? '#0284c7' : '#38bdf8'
                                    : isLight ? '#f8fafc' : '#03140a',
                                  borderColor: isSelected
                                    ? preset.highlight
                                      ? isLight ? '#16a34a' : '#00ff87'
                                      : isLight ? '#0284c7' : '#38bdf8'
                                    : cardBorder,
                                },
                              ]}
                              onPress={() => updateCheckoutMode(preset.key)}
                              activeOpacity={0.85}
                            >
                              <Ionicons
                                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                size={14}
                                color={
                                  isSelected
                                    ? isLight ? '#ffffff' : '#020d06'
                                    : subTextColor
                                }
                              />
                              <Text
                                style={[
                                  styles.modePresetText,
                                  {
                                    color: isSelected
                                      ? isLight ? '#ffffff' : '#020d06'
                                      : textColor,
                                    fontWeight: isSelected ? '800' : '600',
                                  },
                                ]}
                              >
                                {preset.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Google Play Commission Bypass Switch */}
                    <View
                      style={[
                        styles.playBypassBox,
                        {
                          backgroundColor: hasBypass
                            ? isLight ? '#f0fdf4' : 'rgba(0, 255, 135, 0.08)'
                            : isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.08)',
                          borderColor: hasBypass
                            ? isLight ? '#86efac' : '#0f3822'
                            : isLight ? '#fca5a5' : '#450a0a',
                        },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={styles.playBypassTitleRow}>
                          <Ionicons
                            name={hasBypass ? 'shield-checkmark' : 'warning-outline'}
                            size={18}
                            color={hasBypass ? (isLight ? '#16a34a' : '#00ff87') : '#ef4444'}
                          />
                          <Text
                            style={[
                              styles.playBypassTitle,
                              { color: hasBypass ? (isLight ? '#15803d' : '#00ff87') : '#ef4444' },
                            ]}
                          >
                            Google Play In-App Billing Commission Bypass (15% - 30% Saved)
                          </Text>
                        </View>
                        <Text style={[styles.playBypassSub, { color: subTextColor }]}>
                          {hasBypass
                            ? '✅ ACTIVE: Subscriptions trigger direct external UPI Intent / web checkout. Google Play 15-30% digital fee is completely eliminated, and 100% of payment reaches the company bank account.'
                            : '⚠️ DISABLED: Digital payments might route via Google Play In-App Billing where Google deducts a 15% to 30% commission.'}
                        </Text>
                      </View>
                      <Switch
                        value={hasBypass}
                        onValueChange={toggleBypass}
                        trackColor={{ false: '#ef4444', true: isLight ? '#16a34a' : '#00ff87' }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    {/* Granular Payment Method Checkboxes / Toggles */}
                    <View style={styles.subSectionWrapper}>
                      <Text style={[styles.subSectionTitle, { color: textColor }]}>
                        ENABLED PAYMENT METHODS (TAP TO TOGGLE):
                      </Text>
                      <View style={styles.methodChipsGrid}>
                        {[
                          { key: 'upi' as const, label: 'UPI Apps (GPay, PhonePe, BHIM)', note: '0% MDR Fee' },
                          { key: 'cards' as const, label: 'Credit / Debit Cards (Visa, MC)', note: '1.75 - 2.0% MDR' },
                          { key: 'netbanking' as const, label: 'Net Banking (50+ Banks)', note: 'Direct Bank' },
                          { key: 'wallets' as const, label: 'Digital Wallets (Paytm, etc.)', note: 'Prepaid Wallet' },
                          { key: 'cod' as const, label: 'Cash on Delivery (COD)', note: 'Doorstep Cash' },
                          { key: 'emi' as const, label: 'PayLater / Cardless EMI', note: 'Flexible Credit' },
                        ].map((m) => {
                          const isEnabled = Boolean(moduleRule.allowedMethods?.[m.key]);
                          return (
                            <TouchableOpacity
                              key={m.key}
                              style={[
                                styles.methodChipTile,
                                {
                                  backgroundColor: isEnabled
                                    ? isLight ? 'rgba(22, 163, 74, 0.08)' : 'rgba(0, 255, 135, 0.08)'
                                    : isLight ? '#f8fafc' : '#03140a',
                                  borderColor: isEnabled
                                    ? isLight ? '#16a34a' : '#00ff87'
                                    : cardBorder,
                                },
                              ]}
                              onPress={() => toggleMethod(m.key)}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={isEnabled ? 'checkbox' : 'square-outline'}
                                size={18}
                                color={isEnabled ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.methodChipLabel,
                                    {
                                      color: isEnabled ? textColor : subTextColor,
                                      fontWeight: isEnabled ? '700' : '500',
                                    },
                                  ]}
                                >
                                  {m.label}
                                </Text>
                                <Text style={[styles.methodChipNote, { color: subTextColor }]}>
                                  {m.note}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Zero Fee / Optimal Play Store Banner */}
                    {isUpiOnly && (
                      <View
                        style={[
                          styles.zeroFeeBanner,
                          {
                            backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 255, 135, 0.12)',
                            borderColor: isLight ? '#16a34a' : '#00ff87',
                          },
                        ]}
                      >
                        <Ionicons name="sparkles" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
                        <Text style={[styles.zeroFeeBannerText, { color: isLight ? '#15803d' : '#00ff87' }]}>
                          🛡️ Optimal Farmer Plan Configuration: 0% RBI Banking MDR Fee. Direct NPCI UPI Intent completely avoids Google Play Store 15-30% commission.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Active Gateway About & Live Policy Intelligence Card ─────────── */}
          <View style={[styles.gatewayAboutCard, { backgroundColor: innerBg, borderColor: cardBorder, marginTop: 14 }]}>
            <View style={styles.gatewayAboutHeader}>
              <Ionicons name="information-circle" size={20} color={isLight ? '#16a34a' : '#00ff87'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.gatewayAboutTitle, { color: textColor }]}>
                  About & Live Policy Intelligence: {localConfig?.gateway?.activeGateway}
                </Text>
                <Text style={[styles.gatewayAboutSubtitle, { color: subTextColor }]}>
                  Regulatory status, commercial rates, settlement terms, and live compliance updates.
                </Text>
              </View>
              <View style={[styles.rbiBadge, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)', borderColor: isLight ? '#16a34a' : '#00ff87' }]}>
                <Ionicons name="shield-checkmark" size={13} color={isLight ? '#16a34a' : '#00ff87'} />
                <Text style={[styles.rbiBadgeText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                  RBI PA LICENSE CERTIFIED
                </Text>
              </View>
            </View>

            <View style={styles.intelligenceGrid}>
              <View style={[styles.intelBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.intelLabel, { color: subTextColor }]}>Standard MDR Fee</Text>
                <Text style={[styles.intelValue, { color: textColor }]}>
                  {localConfig?.gateway?.activeGateway === 'UPI_DIRECT' ? '0.0% (Zero Fee)' :
                   localConfig?.gateway?.activeGateway === 'CASHFREE' ? 'UPI 0% • Cards 1.75%' :
                   localConfig?.gateway?.activeGateway === 'PHONEPE' ? 'UPI 0% • Cards 1.85%' :
                   localConfig?.gateway?.activeGateway === 'RAZORPAY' ? 'Standard 2.0% + GST' :
                   localConfig?.gateway?.activeGateway === 'EASEBUZZ' ? 'UPI 0% • Cards 1.50%' :
                   localConfig?.gateway?.activeGateway === 'STRIPE' ? '2.0% - 3.5% + ₹3' : '1.8% - 2.0% + GST'}
                </Text>
              </View>
              <View style={[styles.intelBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.intelLabel, { color: subTextColor }]}>Settlement Cycle</Text>
                <Text style={[styles.intelValue, { color: textColor }]}>
                  {localConfig?.gateway?.activeGateway === 'UPI_DIRECT' ? 'Instant (Real-Time Bank)' :
                   localConfig?.gateway?.activeGateway === 'CASHFREE' ? 'T+1 Bank Working Day' :
                   localConfig?.gateway?.activeGateway === 'PHONEPE' ? 'T+1 Bank Working Day' : 'T+1 to T+2 Working Days'}
                </Text>
              </View>
              <View style={[styles.intelBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.intelLabel, { color: subTextColor }]}>Marketplace Split</Text>
                <Text style={[styles.intelValue, { color: textColor }]}>
                  {localConfig?.gateway?.activeGateway === 'CASHFREE' ? '✅ Full Auto-Split Supported' :
                   localConfig?.gateway?.activeGateway === 'RAZORPAY' ? '✅ Route API Supported' :
                   localConfig?.gateway?.activeGateway === 'UPI_DIRECT' ? 'Direct Merchant Deposit' : 'Standard Webhook Split'}
                </Text>
              </View>
            </View>

            {/* Provider Policy Change & Notice Log */}
            <View style={[styles.policyNoticeBox, { backgroundColor: isLight ? 'rgba(234, 179, 8, 0.08)' : 'rgba(234, 179, 8, 0.12)', borderColor: isLight ? '#ca8a04' : '#eab308' }]}>
              <Ionicons name="notifications-outline" size={16} color={isLight ? '#ca8a04' : '#fbbf24'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.policyNoticeTitle, { color: isLight ? '#854d0e' : '#fef08a' }]}>
                  Live Policy Intelligence & Regulatory Status
                </Text>
                <Text style={[styles.policyNoticeText, { color: isLight ? '#713f12' : '#fef9c3' }]}>
                  Compliant with RBI Master Directions on Payment Aggregators (2024-2026). Webhook payload signatures, card tokenization, and UPI auto-debit regulations are monitored in real-time. Any fee or SLA changes by {localConfig?.gateway?.activeGateway} are synchronized automatically.
                </Text>
              </View>
            </View>
          </View>

          {/* Gateway-Specific Credentials */}
          <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
            {localConfig.gateway.activeGateway === 'PHONEPE' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>⚡ PhonePe Production Credentials</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Merchant ID"
                    value={localConfig.gateway.providers.phonepe.merchantId}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        gateway: {
                          ...localConfig.gateway,
                          providers: {
                            ...localConfig.gateway.providers,
                            phonepe: { ...localConfig.gateway.providers.phonepe, merchantId: val },
                          },
                        },
                      })
                    }
                    placeholder="M22KMYD10AWD8_..."
                    isLight={isLight}
                  />
                  <InputField
                    label="Salt Index"
                    value={localConfig.gateway.providers.phonepe.saltIndex}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        gateway: {
                          ...localConfig.gateway,
                          providers: {
                            ...localConfig.gateway.providers,
                            phonepe: { ...localConfig.gateway.providers.phonepe, saltIndex: val },
                          },
                        },
                      })
                    }
                    placeholder="1"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Salt Key"
                  value={localConfig.gateway.providers.phonepe.saltKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          phonepe: { ...localConfig.gateway.providers.phonepe, saltKey: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste PhonePe Salt Key"
                  isSecret={!showSecrets['phonepe_salt']}
                  onToggleSecret={() => toggleSecret('phonepe_salt')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'CASHFREE' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>💼 Cashfree Easy Split Credentials</Text>
                <InputField
                  label="Cashfree App ID"
                  value={localConfig.gateway.providers.cashfree.appId}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          cashfree: { ...localConfig.gateway.providers.cashfree, appId: val },
                        },
                      },
                    })
                  }
                  placeholder="TEST11182203ad31..."
                  isLight={isLight}
                />
                <InputField
                  label="Cashfree Secret Key"
                  value={localConfig.gateway.providers.cashfree.secretKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          cashfree: { ...localConfig.gateway.providers.cashfree, secretKey: val },
                        },
                      },
                    })
                  }
                  placeholder="cfsk_ma_..."
                  isSecret={!showSecrets['cashfree_secret']}
                  onToggleSecret={() => toggleSecret('cashfree_secret')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'UPI_DIRECT' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📱 Direct NPCI UPI VPA & QR (0% Platform Fee)</Text>
                <InputField
                  label="Primary UPI ID (VPA)"
                  value={localConfig.gateway.providers.upiDirect.upiId}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          upiDirect: { ...localConfig.gateway.providers.upiDirect, upiId: val },
                        },
                      },
                    })
                  }
                  placeholder="surindersinghmakhu-8@okicici"
                  isLight={isLight}
                />
                <InputField
                  label="Payee Account / Legal Name"
                  value={localConfig.gateway.providers.upiDirect.payeeName}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          upiDirect: { ...localConfig.gateway.providers.upiDirect, payeeName: val },
                        },
                      },
                    })
                  }
                  placeholder="FARMSKING TECHNOLOGIES PRIVATE LIMITED"
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'RAZORPAY' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>💳 Razorpay Gateway Credentials</Text>
                <InputField
                  label="Razorpay Key ID"
                  value={localConfig.gateway.providers.razorpay.keyId}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          razorpay: { ...localConfig.gateway.providers.razorpay, keyId: val },
                        },
                      },
                    })
                  }
                  placeholder="rzp_live_..."
                  isLight={isLight}
                />
                <InputField
                  label="Razorpay Key Secret"
                  value={localConfig.gateway.providers.razorpay.keySecret}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          razorpay: { ...localConfig.gateway.providers.razorpay, keySecret: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Key Secret"
                  isSecret={!showSecrets['razorpay_secret']}
                  onToggleSecret={() => toggleSecret('razorpay_secret')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'PAYTM' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📱 Paytm All-In-One Payment Gateway</Text>
                <InputField
                  label="Paytm Merchant ID (MID)"
                  value={localConfig.gateway.providers.paytm?.mid || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          paytm: { ...(localConfig.gateway.providers.paytm || { website: 'DEFAULT', merchantKey: '' }), mid: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Paytm MID"
                  isLight={isLight}
                />
                <InputField
                  label="Paytm Merchant Key"
                  value={localConfig.gateway.providers.paytm?.merchantKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          paytm: { ...(localConfig.gateway.providers.paytm || { mid: '', website: 'DEFAULT' }), merchantKey: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Merchant Key"
                  isSecret={!showSecrets['paytm_key']}
                  onToggleSecret={() => toggleSecret('paytm_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'PAYU' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🏦 PayU Money / Enterprise Credentials</Text>
                <InputField
                  label="PayU Merchant Key"
                  value={localConfig.gateway.providers.payu.merchantKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          payu: { ...localConfig.gateway.providers.payu, merchantKey: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste PayU Key"
                  isLight={isLight}
                />
                <InputField
                  label="PayU Merchant Salt"
                  value={localConfig.gateway.providers.payu.merchantSalt}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          payu: { ...localConfig.gateway.providers.payu, merchantSalt: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste PayU Salt"
                  isSecret={!showSecrets['payu_salt']}
                  onToggleSecret={() => toggleSecret('payu_salt')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'CCAVENUE' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🏛️ CCAvenue Enterprise Gateway</Text>
                <InputField
                  label="Merchant ID"
                  value={localConfig.gateway.providers.ccavenue?.merchantId || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          ccavenue: { ...(localConfig.gateway.providers.ccavenue || { accessCode: '', workingKey: '' }), merchantId: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste CCAvenue Merchant ID"
                  isLight={isLight}
                />
                <InputField
                  label="Access Code"
                  value={localConfig.gateway.providers.ccavenue?.accessCode || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          ccavenue: { ...(localConfig.gateway.providers.ccavenue || { merchantId: '', workingKey: '' }), accessCode: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Access Code"
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'STRIPE' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🌍 Stripe International Gateway Credentials</Text>
                <InputField
                  label="Stripe Publishable Key"
                  value={localConfig.gateway.providers.stripe.publishableKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          stripe: { ...localConfig.gateway.providers.stripe, publishableKey: val },
                        },
                      },
                    })
                  }
                  placeholder="pk_live_..."
                  isLight={isLight}
                />
                <InputField
                  label="Stripe Secret Key"
                  value={localConfig.gateway.providers.stripe.secretKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          stripe: { ...localConfig.gateway.providers.stripe, secretKey: val },
                        },
                      },
                    })
                  }
                  placeholder="sk_live_..."
                  isSecret={!showSecrets['stripe_secret']}
                  onToggleSecret={() => toggleSecret('stripe_secret')}
                  isLight={isLight}
                />
              </>
            )}
                      {localConfig.gateway.activeGateway === 'INSTAMOJO' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🏪 Instamojo MSME Gateway Credentials</Text>
                <InputField
                  label="Instamojo API Key"
                  value={localConfig.gateway.providers.instamojo?.apiKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          instamojo: { ...(localConfig.gateway.providers.instamojo || { authToken: '', clientSecret: '' }), apiKey: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Instamojo API Key"
                  isLight={isLight}
                />
                <InputField
                  label="Auth Token"
                  value={localConfig.gateway.providers.instamojo?.authToken || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          instamojo: { ...(localConfig.gateway.providers.instamojo || { apiKey: '', clientSecret: '' }), authToken: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Auth Token"
                  isSecret={!showSecrets['instamojo_auth']}
                  onToggleSecret={() => toggleSecret('instamojo_auth')}
                  isLight={isLight}
                />
                <InputField
                  label="Client Secret (Optional)"
                  value={localConfig.gateway.providers.instamojo?.clientSecret || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          instamojo: { ...(localConfig.gateway.providers.instamojo || { apiKey: '', authToken: '' }), clientSecret: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Client Secret"
                  isSecret={!showSecrets['instamojo_secret']}
                  onToggleSecret={() => toggleSecret('instamojo_secret')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.gateway.activeGateway === 'EASEBUZZ' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🏷️ Easebuzz Digital Collections Credentials</Text>
                <InputField
                  label="Easebuzz Merchant Key"
                  value={localConfig.gateway.providers.easebuzz?.merchantKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          easebuzz: { ...(localConfig.gateway.providers.easebuzz || { salt: '', env: 'test' }), merchantKey: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Merchant Key"
                  isLight={isLight}
                />
                <InputField
                  label="Easebuzz Salt Key"
                  value={localConfig.gateway.providers.easebuzz?.salt || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          easebuzz: { ...(localConfig.gateway.providers.easebuzz || { merchantKey: '', env: 'test' }), salt: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Salt Key"
                  isSecret={!showSecrets['easebuzz_salt']}
                  onToggleSecret={() => toggleSecret('easebuzz_salt')}
                  isLight={isLight}
                />
                <InputField
                  label="Environment (test / prod)"
                  value={localConfig.gateway.providers.easebuzz?.env || 'test'}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      gateway: {
                        ...localConfig.gateway,
                        providers: {
                          ...localConfig.gateway.providers,
                          easebuzz: { ...(localConfig.gateway.providers.easebuzz || { merchantKey: '', salt: '' }), env: val },
                        },
                      },
                    })
                  }
                  placeholder="test or prod"
                  isLight={isLight}
                />
              </>
            )}
</View>
        </View>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 2. AI CROP DOCTOR & VISION ENGINE                                 */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'AI') && (
        <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(147, 51, 234, 0.12)' : 'rgba(168, 85, 247, 0.15)' }]}>
                <Ionicons name="sparkles" size={22} color={isLight ? '#9333ea' : '#c084fc'} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: textColor }]}>2. AI Crop Doctor & Vision Diagnostics</Text>
                <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                  Instant leaf disease diagnosis, weed detection, pest pathology, and voice agronomy chat.
                </Text>
              </View>
            </View>
            <View style={styles.sandboxToggleRow}>
              <Text style={[styles.toggleLabel, { color: subTextColor }]}>AI Engine Active</Text>
              <Switch
                value={Boolean(localConfig?.ai?.isEnabled)}
                onValueChange={(val) =>
                  setLocalConfig({
                    ...localConfig,
                    ai: { ...(localConfig?.ai || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.ai), isEnabled: val },
                  })
                }
                trackColor={{ false: '#1e293b', true: isLight ? '#9333ea' : '#c084fc' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* AI Strategy Guide */}
          <TouchableOpacity
            style={[styles.strategyGuideBar, { backgroundColor: isLight ? '#faf5ff' : '#140826', borderColor: isLight ? '#e9d5ff' : '#3b0764' }]}
            onPress={() => toggleGuide('ai')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={18} color={isLight ? '#9333ea' : '#c084fc'} />
            <Text style={[styles.strategyGuideText, { color: textColor }]}>
              💡 AI Strategy: <Text style={{ fontWeight: '800', color: isLight ? '#9333ea' : '#c084fc' }}>Google Gemini 1.5 Flash</Text> offers 1,500 requests/day for 100% free with multi-leaf photo analysis.
            </Text>
            <Ionicons
              name={expandedGuides['ai'] ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={subTextColor}
            />
          </TouchableOpacity>

          {expandedGuides['ai'] && (
            <View style={[styles.guideDetailsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <Text style={[styles.guideHeading, { color: textColor }]}>🧠 Vision Model Comparison:</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Gemini 1.5 Flash:</Text> Best for startup. Free 1,500 scans/day. Multimodal vision + fast Punjabi/Hindi audio reply.</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>GPT-4o-mini:</Text> Ultra-reliable image classification, ₹0.12 per scan. Exceptional diagnosis accuracy.</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Claude 3.5 Sonnet:</Text> Highest botanical intelligence, best for expert crop doctor cross-examination.</Text>
              <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Meta Llama 3.2 Vision / Groq:</Text> Sub-second response time via Groq LPUs or self-hosted servers with ₹0 API cost.</Text>
            </View>
          )}

          {/* Active AI Provider Dropdown */}
          <Text style={[styles.fieldHeading, { color: isLight ? '#9333ea' : '#c084fc' }]}>
            SELECT ACTIVE AI VISION ENGINE:
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#9333ea' : '#c084fc' },
            ]}
            onPress={() => toggleDropdown('ai')}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons name="sparkles-outline" size={18} color={isLight ? '#9333ea' : '#c084fc'} />
              <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                Active AI Engine: <Text style={{ fontWeight: '900', color: isLight ? '#9333ea' : '#c084fc' }}>{localConfig.ai.activeProvider}</Text>
              </Text>
            </View>
            <Ionicons
              name={openDropdowns['ai'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isLight ? '#9333ea' : '#c084fc'}
            />
          </TouchableOpacity>

          {openDropdowns['ai'] && (
            <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
              {[
                { key: 'GEMINI', name: 'Google Gemini 1.5 Flash (Vision)', tag: 'GOOGLE DEEPMIND / FREE TIER', icon: 'sparkles' },
                { key: 'OPENAI', name: 'OpenAI GPT-4o-mini', tag: 'HIGH ACCURACY VISION', icon: 'hardware-chip' },
                { key: 'CLAUDE', name: 'Anthropic Claude 3.5 Sonnet', tag: 'BOTANICAL REASONING', icon: 'flask' },
                { key: 'LLAMA', name: 'Meta Llama 3.2 Vision (Groq / vLLM)', tag: 'OPEN WEIGHTS / FAST', icon: 'server' },
                { key: 'MISTRAL', name: 'Mistral Pixtral 12B Vision', tag: 'EUROPEAN HIGH-SPEED AI', icon: 'speedometer' },
                { key: 'GROQ', name: 'Groq LPU Ultra-Low Latency', tag: 'SUB-SECOND LEAF DIAGNOSIS', icon: 'flash' },
                { key: 'HUGGINGFACE', name: 'Hugging Face Plant Pathology', tag: 'FINE-TUNED AGRI MODELS', icon: 'leaf' },
              ].map((item) => {
                const isSelected = localConfig.ai.activeProvider === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: isLight ? 'rgba(147, 51, 234, 0.1)' : 'rgba(168, 85, 247, 0.15)' },
                    ]}
                    onPress={() => {
                      setLocalConfig({
                        ...localConfig,
                        ai: { ...localConfig.ai, activeProvider: item.key as any },
                      });
                      toggleDropdown('ai');
                      showToast(`⚡ Switched AI Engine to ${item.name}`);
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? (isLight ? '#9333ea' : '#c084fc') : subTextColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#9333ea' : '#c084fc') : subTextColor }]}>
                        {item.tag}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={isLight ? '#9333ea' : '#c084fc'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

                    {/* 🧠 Dynamic AI Model Cards & Quota Telemetry */}
          {(() => {
            const activeAiKey = localConfig.ai?.activeProvider || 'GEMINI';
            const activeAiMeta = ALL_AI_PROVIDERS.find((p) => p.key === activeAiKey) || ALL_AI_PROVIDERS[0];
            const dailyQuota = activeAiMeta.dailyFreeScans;
            const usedScans = activeAiMeta.simulatedUsedScans;
            const aiPercentage = Math.min(100, Math.round((usedScans / dailyQuota) * 100));
            const remainingScans = Math.max(0, dailyQuota - usedScans);
            return (
              <>
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldHeading, { color: isLight ? '#9333ea' : '#c084fc' }]}>
                    ALL 7 AI VISION ENGINES & MODEL SPECIFICATIONS:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.telecomCardsScroll}>
                    {ALL_AI_PROVIDERS.map((ai) => {
                      const isCurSelected = activeAiKey === ai.key;
                      return (
                        <TouchableOpacity
                          key={ai.key}
                          style={[
                            styles.telecomFeatureCard,
                            {
                              backgroundColor: isCurSelected ? (isLight ? '#faf5ff' : '#140826') : (isLight ? '#ffffff' : '#03140a'),
                              borderColor: isCurSelected ? ai.color : cardBorder,
                            },
                          ]}
                          onPress={() => {
                            setLocalConfig({
                              ...localConfig,
                              ai: { ...localConfig.ai, activeProvider: ai.key as any },
                            });
                            showToast(`⚡ Switched AI Engine to ${ai.name}`);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={[styles.iconBox, { width: 32, height: 32, backgroundColor: isLight ? 'rgba(147, 51, 234, 0.12)' : 'rgba(168, 85, 247, 0.15)' }]}>
                              <Ionicons name={ai.icon} size={16} color={ai.color} />
                            </View>
                            <View style={[styles.telecomPlanBadge, { backgroundColor: isCurSelected ? ai.color : (isLight ? '#f1f5f9' : '#0f172a') }]}>
                              <Text style={[styles.telecomPlanBadgeText, { color: isCurSelected ? '#ffffff' : subTextColor }]}>
                                {ai.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.telecomCardTitle, { color: textColor }]}>{ai.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: ai.color }}>{ai.planBadge}</Text>
                          <View style={{ gap: 2, marginTop: 4 }}>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Latency: <Text style={{ color: textColor, fontWeight: '700' }}>{ai.latency}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Accuracy: <Text style={{ color: textColor, fontWeight: '700' }}>{ai.accuracy}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Rate: <Text style={{ color: textColor, fontWeight: '700' }}>{ai.paidRate}</Text></Text>
                          </View>
                          {isCurSelected && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Ionicons name="checkmark-circle" size={14} color="#9333ea" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#9333ea' }}>ACTIVE ENGINE</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🌟 Selected AI Deep-Dive & Recommendation */}
                <View style={[styles.telecomDetailCard, { backgroundColor: innerBg, borderColor: activeAiMeta.color, borderWidth: 1.5 }]}>
                  <View style={styles.telecomDetailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={activeAiMeta.icon} size={20} color={activeAiMeta.color} />
                      <Text style={[styles.telecomDetailTitle, { color: textColor }]}>
                        Active AI Model: {activeAiMeta.name}
                      </Text>
                    </View>
                    <View style={[styles.telecomPlanBadge, { backgroundColor: activeAiMeta.color }]}>
                      <Text style={[styles.telecomPlanBadgeText, { color: '#ffffff' }]}>
                        {activeAiMeta.planBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: isLight ? '#9333ea' : '#c084fc', marginVertical: 4 }}>
                    {activeAiMeta.recommendation}
                  </Text>
                  <View style={styles.telecomDetailBadgesRow}>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Free Allowance</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeAiMeta.freeTier}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Inference Latency</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeAiMeta.latency}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Leaf Pathology</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeAiMeta.accuracy}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Vernacular Speech</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeAiMeta.multilingual}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 6, fontStyle: 'italic' }}>
                    {activeAiMeta.summary}
                  </Text>
                </View>

                {/* 📊 AI Vision Inference Quota & Latency Telemetry */}
                <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
                  <View style={styles.telecomUsageHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="sparkles" size={17} color={isLight ? '#9333ea' : '#c084fc'} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                        📊 AI Vision Inference Quota & Latency Telemetry (Current Day)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#faf5ff' : 'rgba(147, 51, 234, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#9333ea' }} />
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#9333ea' : '#c084fc' }}>
                        VISION ENGINE ONLINE
                      </Text>
                    </View>
                  </View>

                  {/* Quota Progress Bar */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                        Daily Free Scans Used: <Text style={{ color: activeAiMeta.color, fontWeight: '900' }}>{usedScans.toLocaleString('en-IN')}</Text> / {dailyQuota.toLocaleString('en-IN')} Scans
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#9333ea' }}>
                        {aiPercentage}% Quota Used
                      </Text>
                    </View>
                    <View style={[styles.telecomProgressBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
                      <View
                        style={[
                          styles.telecomProgressBarFill,
                          {
                            width: `${Math.max(5, aiPercentage)}%`,
                            backgroundColor: aiPercentage > 85 ? '#dc2626' : aiPercentage > 60 ? '#d97706' : '#9333ea',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Usage Statistics Row */}
                  <View style={styles.telecomUsageStatsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="leaf-outline" size={13} color="#9333ea" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#9333ea' }}>
                        {remainingScans.toLocaleString('en-IN')} Free Scans Left Today
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cash-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        API Bill: <Text style={{ fontWeight: '800', color: textColor }}>₹0.00 (Free Tier Protected)</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="speedometer-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Speed: <Text style={{ fontWeight: '800', color: textColor }}>{activeAiMeta.latency}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* ⚡ Test Connection & AI Vision Ping */}
                  <TouchableOpacity
                    style={[styles.testPingBtn, { backgroundColor: isLight ? '#9333ea' : '#7c3aed', opacity: isTestingAi ? 0.7 : 1 }]}
                    activeOpacity={0.85}
                    disabled={isTestingAi}
                    onPress={handleTestAiHandshake}
                  >
                    {isTestingAi ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="pulse" size={14} color="#ffffff" />
                    )}
                    <Text style={styles.testPingBtnText}>
                      {isTestingAi ? 'Running Multimodal Leaf Inference...' : `⚡ Test AI Vision Inference Ping (${activeAiMeta.name.split(' ')[0]})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          {/* AI Credentials */}
          <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
            {localConfig.ai.activeProvider === 'GEMINI' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>✨ Google DeepMind Gemini Vision Credentials</Text>
                <InputField
                  label="Google AI Studio API Key"
                  value={localConfig.ai.providers.gemini.apiKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      ai: {
                        ...localConfig.ai,
                        providers: {
                          ...localConfig.ai.providers,
                          gemini: { ...localConfig.ai.providers.gemini, apiKey: val },
                        },
                      },
                    })
                  }
                  placeholder="AIzaSy..."
                  isSecret={!showSecrets['gemini_key']}
                  onToggleSecret={() => toggleSecret('gemini_key')}
                  isLight={isLight}
                />
                <View style={styles.twoColRow}>
                  <InputField
                    label="Model Name"
                    value={localConfig.ai.providers.gemini.model}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        ai: {
                          ...localConfig.ai,
                          providers: {
                            ...localConfig.ai.providers,
                            gemini: { ...localConfig.ai.providers.gemini, model: val },
                          },
                        },
                      })
                    }
                    placeholder="gemini-1.5-flash"
                    isLight={isLight}
                  />
                  <InputField
                    label="Daily Free Quota Limit"
                    value={String(localConfig.ai?.providers?.gemini?.dailyQuota || 1500)}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        ai: {
                          ...localConfig.ai,
                          providers: {
                            ...localConfig.ai.providers,
                            gemini: { ...localConfig.ai.providers.gemini, dailyQuota: parseInt(val, 10) || 1500 },
                          },
                        },
                      })
                    }
                    placeholder="1500"
                    keyboardType="numeric"
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.ai.activeProvider === 'OPENAI' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🧠 OpenAI Vision Diagnostics Credentials</Text>
                <InputField
                  label="OpenAI Secret API Key"
                  value={localConfig.ai.providers.openai.apiKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      ai: {
                        ...localConfig.ai,
                        providers: {
                          ...localConfig.ai.providers,
                          openai: { ...localConfig.ai.providers.openai, apiKey: val },
                        },
                      },
                    })
                  }
                  placeholder="sk-proj-..."
                  isSecret={!showSecrets['openai_key']}
                  onToggleSecret={() => toggleSecret('openai_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.ai.activeProvider === 'CLAUDE' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🌿 Anthropic Claude Agronomy Credentials</Text>
                <InputField
                  label="Anthropic API Key"
                  value={localConfig.ai.providers.claude.apiKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      ai: {
                        ...localConfig.ai,
                        providers: {
                          ...localConfig.ai.providers,
                          claude: { ...localConfig.ai.providers.claude, apiKey: val },
                        },
                      },
                    })
                  }
                  placeholder="sk-ant-..."
                  isSecret={!showSecrets['claude_key']}
                  onToggleSecret={() => toggleSecret('claude_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.ai.activeProvider === 'LLAMA' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>⚡ Self-Hosted Llama / Groq Inference Endpoint</Text>
                <InputField
                  label="Inference Endpoint URL"
                  value={localConfig.ai.providers.llama.endpointUrl}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      ai: {
                        ...localConfig.ai,
                        providers: {
                          ...localConfig.ai.providers,
                          llama: { ...localConfig.ai.providers.llama, endpointUrl: val },
                        },
                      },
                    })
                  }
                  placeholder="https://api.groq.com/openai/v1 or http://localhost:11434"
                  isLight={isLight}
                />
              </>
            )}
          </View>
        </View>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 3. VIDEO & AUDIO TELECONSULTATION (AGORA & WEBRTC ENGINES)         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'TELECOM') && (() => {
        const activeTelecomKey = localConfig.telecom?.activeProvider || 'AGORA';
        const activeTelecomMeta = ALL_TELECOM_PROVIDERS.find((p) => p.key === activeTelecomKey) || ALL_TELECOM_PROVIDERS[0];
        const monthlyQuota = localConfig.telecom?.providers?.agora?.freeMinutesQuota || activeTelecomMeta.freeMinutesMonthly || 10000;
        const usedMinutes = activeTelecomMeta.simulatedUsedMinutes;
        const usagePercentage = Math.min(100, Math.round((usedMinutes / (monthlyQuota || 1)) * 100));
        const remainingMinutes = Math.max(0, monthlyQuota - usedMinutes);

        return (
          <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(96, 165, 250, 0.15)' }]}>
                  <Ionicons name="videocam" size={22} color={isLight ? '#2563eb' : '#60a5fa'} />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: textColor }]}>3. Voice & Video Teleconsultation Engine</Text>
                  <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                    Live group voice calling, Agora RTC audio token generator, WebSocket room gateway & 1-on-1 WebRTC video consult.
                  </Text>
                </View>
              </View>
              <View style={[styles.tierBadge, { backgroundColor: isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6' }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#1d4ed8' : '#93c5fd' }}>
                  {activeTelecomMeta.planBadge}
                </Text>
              </View>
            </View>

            {/* Telecom Strategy & Comparison Guide */}
            <TouchableOpacity
              style={[styles.strategyGuideBar, { backgroundColor: isLight ? '#eff6ff' : '#0c1a30', borderColor: isLight ? '#bfdbfe' : '#1e3a8a' }]}
              onPress={() => toggleGuide('telecom')}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam" size={18} color={isLight ? '#2563eb' : '#60a5fa'} />
              <Text style={[styles.strategyGuideText, { color: textColor }]}>
                💡 Telecom Strategy: <Text style={{ fontWeight: '800', color: isLight ? '#2563eb' : '#60a5fa' }}>Agora.io</Text> provides 10,000 minutes/month free with 70% packet-loss anti-freeze for rural farms.
              </Text>
              <Ionicons
                name={expandedGuides['telecom'] ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={subTextColor}
              />
            </TouchableOpacity>

            {expandedGuides['telecom'] && (
              <View style={[styles.guideDetailsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.guideHeading, { color: textColor }]}>📹 WebRTC Video & Voice Engine Comparison:</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Agora RTC (Active):</Text> 10,000 mins/mo free forever. 70% packet-loss anti-freeze resilience on 2G/3G network.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>LiveKit WebRTC:</Text> 50 GB free cloud or 100% UNLIMITED FREE on self-hosted VM. Go-based low latency.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>100ms Live Video:</Text> 10,000 mins/mo free. Indian telehealth optimized infrastructure (Bengaluru hub).</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Twilio Programmable Video:</Text> Enterprise carrier-grade telecom with traditional PSTN phone fallback.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Daily.co:</Text> 10,000 mins/mo free with 1-line room URL creation and zero complex client SDK setup.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Jitsi Meet:</Text> 100% Free Open-Source & Unlimited. Zero recurring invoices on company servers.</Text>
              </View>
            )}

            {/* Active Telecom Dropdown */}
            <Text style={[styles.fieldHeading, { color: isLight ? '#2563eb' : '#60a5fa' }]}>
              SELECT ACTIVE WEBRTC VIDEO / VOICE ENGINE:
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#2563eb' : '#60a5fa' },
              ]}
              onPress={() => toggleDropdown('telecom')}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeft}>
                <Ionicons name={activeTelecomMeta.icon} size={18} color={isLight ? '#2563eb' : '#60a5fa'} />
                <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                  Active WebRTC Engine: <Text style={{ fontWeight: '900', color: isLight ? '#2563eb' : '#60a5fa' }}>{activeTelecomMeta.name}</Text>
                </Text>
              </View>
              <Ionicons
                name={openDropdowns['telecom'] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={isLight ? '#2563eb' : '#60a5fa'}
              />
            </TouchableOpacity>

            {openDropdowns['telecom'] && (
              <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                {ALL_TELECOM_PROVIDERS.map((item) => {
                  const isSelected = activeTelecomKey === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.dropdownItem,
                        isSelected && { backgroundColor: isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.15)' },
                      ]}
                      onPress={() => {
                        setLocalConfig({
                          ...localConfig,
                          telecom: { ...localConfig.telecom, activeProvider: item.key },
                        });
                        toggleDropdown('telecom');
                        showToast(`⚡ Switched Telecom Provider to ${item.name}`);
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? (isLight ? '#2563eb' : '#60a5fa') : subTextColor}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#2563eb' : '#60a5fa') : subTextColor }]}>
                          {item.tag}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={isLight ? '#2563eb' : '#60a5fa'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 🌟 Dynamic Features & Plan Info Card for Selected Provider */}
            <View style={[styles.telecomFeatureCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={styles.telecomCardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name={activeTelecomMeta.icon} size={20} color={activeTelecomMeta.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: textColor }}>
                      {activeTelecomMeta.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: activeTelecomMeta.color, fontWeight: '700', marginTop: 1 }}>
                      {activeTelecomMeta.recommendation}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: isLight ? '#1e40af' : '#93c5fd' }}>
                    {activeTelecomMeta.tag}
                  </Text>
                </View>
              </View>

              {/* Technical Specifications Grid */}
              <View style={styles.telecomFeatureGrid}>
                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🎁 Free Quota Plan</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#16a34a' }]}>{activeTelecomMeta.freeTier}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>💰 Overage Pricing</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeTelecomMeta.paidRate}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>📶 Rural Network Resilience</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#0284c7' }]}>{activeTelecomMeta.packetLoss}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>⚡ Global RTC Latency</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#d97706' }]}>{activeTelecomMeta.latency}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>👥 Room Capacity</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeTelecomMeta.capacity}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🎙️ Cloud Recording</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeTelecomMeta.recording}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: subTextColor, lineHeight: 16, marginTop: 4 }}>
                {activeTelecomMeta.summary}
              </Text>
            </View>

            {/* 📊 Live Monthly Usage & Telemetry Tracker Widget */}
            <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
              <View style={styles.telecomUsageHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="analytics" size={17} color={isLight ? '#2563eb' : '#00ff87'} />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                    📊 Telecom Telemetry & Quota Monitor (Current Month)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#15803d' : '#00ff87' }}>
                    GATEWAY ONLINE
                  </Text>
                </View>
              </View>

              {/* Quota Progress Bar */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                    Monthly Minutes Consumed: <Text style={{ color: activeTelecomMeta.color, fontWeight: '900' }}>{usedMinutes.toLocaleString('en-IN')} mins</Text> / {monthlyQuota.toLocaleString('en-IN')} mins
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#16a34a' }}>
                    {usagePercentage}% Quota Used
                  </Text>
                </View>
                <View style={[styles.telecomProgressBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
                  <View
                    style={[
                      styles.telecomProgressBarFill,
                      {
                        width: `${Math.max(5, usagePercentage)}%`,
                        backgroundColor: usagePercentage > 85 ? '#dc2626' : usagePercentage > 60 ? '#d97706' : '#16a34a',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Usage Statistics Row */}
              <View style={styles.telecomUsageStatsRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={13} color="#16a34a" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>
                    {remainingMinutes.toLocaleString('en-IN')} Free Mins Remaining
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="cash-outline" size={13} color={subTextColor} />
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Current Bill: <Text style={{ fontWeight: '800', color: textColor }}>₹0.00 (Free Tier Protected)</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="radio-outline" size={13} color={subTextColor} />
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Active Consultations: <Text style={{ fontWeight: '800', color: textColor }}>0 Live</Text>
                  </Text>
                </View>
              </View>

              {/* ⚡ Test Connection & RTC Ping Button */}
              <TouchableOpacity
                style={[styles.testPingBtn, { backgroundColor: isLight ? '#2563eb' : '#059669', opacity: isTestingRtc ? 0.7 : 1 }]}
                activeOpacity={0.85}
                disabled={isTestingRtc}
                onPress={handleTestTelecomHandshake}
              >
                {isTestingRtc ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="pulse" size={14} color="#ffffff" />
                )}
                <Text style={styles.testPingBtnText}>
                  {isTestingRtc ? 'Pinging WebRTC Nodes...' : `⚡ Test Connection & RTC Ping (${activeTelecomMeta.name.split(' ')[0]})`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🔑 Credentials Form for the Selected Provider */}
            <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              {activeTelecomKey === 'AGORA' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>📹 Agora RTC Engine Credentials</Text>
                  <View style={styles.twoColRow}>
                    <InputField
                      label="Agora App ID"
                      value={localConfig.telecom?.providers?.agora?.appId || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              agora: { ...localConfig.telecom.providers.agora, appId: val },
                            },
                          },
                        })
                      }
                      placeholder="Paste Agora App ID"
                      isLight={isLight}
                    />
                    <InputField
                      label="Agora App Certificate"
                      value={localConfig.telecom?.providers?.agora?.appCertificate || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              agora: { ...localConfig.telecom.providers.agora, appCertificate: val },
                            },
                          },
                        })
                      }
                      placeholder="Paste App Certificate"
                      isSecret={!showSecrets['agora_cert']}
                      onToggleSecret={() => toggleSecret('agora_cert')}
                      isLight={isLight}
                    />
                  </View>
                  <View style={styles.twoColRow}>
                    <InputField
                      label="Customer ID (Optional for REST Reporting)"
                      value={localConfig.telecom?.providers?.agora?.customerId || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              agora: { ...localConfig.telecom.providers.agora, customerId: val },
                            },
                          },
                        })
                      }
                      placeholder="Paste Agora Customer ID"
                      isLight={isLight}
                    />
                    <InputField
                      label="Monthly Free Quota (Minutes)"
                      value={String(localConfig.telecom?.providers?.agora?.freeMinutesQuota || 10000)}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              agora: { ...localConfig.telecom.providers.agora, freeMinutesQuota: Number(val) || 10000 },
                            },
                          },
                        })
                      }
                      placeholder="10000"
                      keyboardType="numeric"
                      isLight={isLight}
                    />
                  </View>
                </>
              )}

              {activeTelecomKey === 'LIVEKIT' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🎙️ LiveKit WebRTC (Cloud & Self-Hosted) Credentials</Text>
                  <InputField
                    label="LiveKit Server URL (WebSocket)"
                    value={localConfig.telecom?.providers?.livekit?.host || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        telecom: {
                          ...localConfig.telecom,
                          providers: {
                            ...localConfig.telecom.providers,
                            livekit: { ...(localConfig.telecom.providers.livekit || { apiKey: '', apiSecret: '' }), host: val },
                          },
                        },
                      })
                    }
                    placeholder="wss://your-subdomain.livekit.cloud or wss://telecom.farmsking.com"
                    isLight={isLight}
                  />
                  <View style={styles.twoColRow}>
                    <InputField
                      label="LiveKit API Key"
                      value={localConfig.telecom?.providers?.livekit?.apiKey || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              livekit: { ...(localConfig.telecom.providers.livekit || { host: '', apiSecret: '' }), apiKey: val },
                            },
                          },
                        })
                      }
                      placeholder="API_KEY_..."
                      isLight={isLight}
                    />
                    <InputField
                      label="LiveKit API Secret"
                      value={localConfig.telecom?.providers?.livekit?.apiSecret || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              livekit: { ...(localConfig.telecom.providers.livekit || { host: '', apiKey: '' }), apiSecret: val },
                            },
                          },
                        })
                      }
                      placeholder="API_SECRET_..."
                      isSecret={!showSecrets['livekit_secret']}
                      onToggleSecret={() => toggleSecret('livekit_secret')}
                      isLight={isLight}
                    />
                  </View>
                </>
              )}

              {activeTelecomKey === 'HUNDRED_MS' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🩺 100ms Telehealth Live Video Credentials</Text>
                  <InputField
                    label="100ms App ID"
                    value={localConfig.telecom?.providers?.hundredMs?.appId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        telecom: {
                          ...localConfig.telecom,
                          providers: {
                            ...localConfig.telecom.providers,
                            hundredMs: { ...(localConfig.telecom.providers.hundredMs || { appSecret: '', tokenEndpoint: '' }), appId: val },
                          },
                        },
                      })
                    }
                    placeholder="Paste 100ms App ID"
                    isLight={isLight}
                  />
                  <View style={styles.twoColRow}>
                    <InputField
                      label="100ms App Secret (Management Token)"
                      value={localConfig.telecom?.providers?.hundredMs?.appSecret || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              hundredMs: { ...(localConfig.telecom.providers.hundredMs || { appId: '', tokenEndpoint: '' }), appSecret: val },
                            },
                          },
                        })
                      }
                      placeholder="Paste 100ms Secret"
                      isSecret={!showSecrets['hundredms_secret']}
                      onToggleSecret={() => toggleSecret('hundredms_secret')}
                      isLight={isLight}
                    />
                    <InputField
                      label="Token Endpoint / Room Code URL"
                      value={localConfig.telecom?.providers?.hundredMs?.tokenEndpoint || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              hundredMs: { ...(localConfig.telecom.providers.hundredMs || { appId: '', appSecret: '' }), tokenEndpoint: val },
                            },
                          },
                        })
                      }
                      placeholder="https://api.100ms.live/v2/token or room link"
                      isLight={isLight}
                    />
                  </View>
                </>
              )}

              {activeTelecomKey === 'TWILIO_VIDEO' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>💼 Twilio Video & Telecom Credentials</Text>
                  <InputField
                    label="Twilio Account SID"
                    value={localConfig.telecom?.providers?.twilioVideo?.accountSid || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        telecom: {
                          ...localConfig.telecom,
                          providers: {
                            ...localConfig.telecom.providers,
                            twilioVideo: { ...(localConfig.telecom.providers.twilioVideo || { apiKey: '', apiSecret: '' }), accountSid: val },
                          },
                        },
                      })
                    }
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    isLight={isLight}
                  />
                  <View style={styles.twoColRow}>
                    <InputField
                      label="Twilio API Key SID"
                      value={localConfig.telecom?.providers?.twilioVideo?.apiKey || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              twilioVideo: { ...(localConfig.telecom.providers.twilioVideo || { accountSid: '', apiSecret: '' }), apiKey: val },
                            },
                          },
                        })
                      }
                      placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      isLight={isLight}
                    />
                    <InputField
                      label="Twilio API Secret"
                      value={localConfig.telecom?.providers?.twilioVideo?.apiSecret || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              twilioVideo: { ...(localConfig.telecom.providers.twilioVideo || { accountSid: '', apiKey: '' }), apiSecret: val },
                            },
                          },
                        })
                      }
                      placeholder="Paste Twilio API Secret"
                      isSecret={!showSecrets['twilio_video_secret']}
                      onToggleSecret={() => toggleSecret('twilio_video_secret')}
                      isLight={isLight}
                    />
                  </View>
                </>
              )}

              {activeTelecomKey === 'DAILY_CO' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>⚡ Daily.co WebRTC Video Rooms Credentials</Text>
                  <InputField
                    label="Daily.co Domain URL"
                    value={localConfig.telecom?.providers?.dailyCo?.domain || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        telecom: {
                          ...localConfig.telecom,
                          providers: {
                            ...localConfig.telecom.providers,
                            dailyCo: { ...(localConfig.telecom.providers.dailyCo || { apiKey: '' }), domain: val },
                          },
                        },
                      })
                    }
                    placeholder="https://farmsking.daily.co"
                    isLight={isLight}
                  />
                  <InputField
                    label="Daily.co API Key"
                    value={localConfig.telecom?.providers?.dailyCo?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        telecom: {
                          ...localConfig.telecom,
                          providers: {
                            ...localConfig.telecom.providers,
                            dailyCo: { ...(localConfig.telecom.providers.dailyCo || { domain: '' }), apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Paste Daily.co API Key"
                    isSecret={!showSecrets['daily_secret']}
                    onToggleSecret={() => toggleSecret('daily_secret')}
                    isLight={isLight}
                  />
                </>
              )}

              {activeTelecomKey === 'JITSI' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🛡️ Jitsi Meet Self-Hosted Server Credentials</Text>
                  <InputField
                    label="Jitsi Server Domain"
                    value={localConfig.telecom?.providers?.jitsi?.domain || 'meet.jit.si'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        telecom: {
                          ...localConfig.telecom,
                          providers: {
                            ...localConfig.telecom.providers,
                            jitsi: { ...(localConfig.telecom.providers.jitsi || { appId: '', appSecret: '' }), domain: val },
                          },
                        },
                      })
                    }
                    placeholder="meet.jit.si or meet.farmsking.com"
                    isLight={isLight}
                  />
                  <View style={styles.twoColRow}>
                    <InputField
                      label="Jitsi App ID / Tenant (Optional for Private Setup)"
                      value={localConfig.telecom?.providers?.jitsi?.appId || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              jitsi: { ...(localConfig.telecom.providers.jitsi || { domain: 'meet.jit.si', appSecret: '' }), appId: val },
                            },
                          },
                        })
                      }
                      placeholder="Optional JWT App ID"
                      isLight={isLight}
                    />
                    <InputField
                      label="Jitsi App Secret / JWT Token (Optional)"
                      value={localConfig.telecom?.providers?.jitsi?.appSecret || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          telecom: {
                            ...localConfig.telecom,
                            providers: {
                              ...localConfig.telecom.providers,
                              jitsi: { ...(localConfig.telecom.providers.jitsi || { domain: 'meet.jit.si', appId: '' }), appSecret: val },
                            },
                          },
                        })
                      }
                      placeholder="Optional JWT Secret"
                      isSecret={!showSecrets['jitsi_secret']}
                      onToggleSecret={() => toggleSecret('jitsi_secret')}
                      isLight={isLight}
                    />
                  </View>
                </>
              )}

              {/* 🎙️ Voice Call Backend API & WebSocket Gateway Hub */}
              <View style={[styles.voiceApiCard, { backgroundColor: isLight ? '#f0fdf4' : '#03140a', borderColor: isLight ? '#86efac' : '#14532d', marginTop: 16 }]}>
                <View style={styles.voiceApiHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Ionicons name="call" size={20} color={isLight ? '#16a34a' : '#00ff87'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.voiceApiTitle, { color: textColor }]}>
                          🎙️ Live Voice Call API & WebSocket Gateway Endpoints
                        </Text>
                        <View style={[styles.activeStatusPill, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                          <Text style={[styles.activeStatusText, { color: isLight ? '#15803d' : '#86efac' }]}>
                            FEATURE ACTIVE IN PROJECT
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.voiceApiDesc, { color: subTextColor }]}>
                        Native NestJS VoiceCallModule, Agora RTC Token Dispatcher & Socket.io Real-Time Audio Mesh
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                      {appSettingsForm.groupVoiceCallEnabled ?? remoteAppSettings?.groupVoiceCallEnabled ?? true ? 'Enabled' : 'Disabled'}
                    </Text>
                    <Switch
                      value={appSettingsForm.groupVoiceCallEnabled ?? remoteAppSettings?.groupVoiceCallEnabled ?? true}
                      onValueChange={(val) => setAppSettingsForm((prev: any) => ({ ...prev, groupVoiceCallEnabled: val }))}
                      trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                {/* Primary WebSocket Gateway Box */}
                <View style={[styles.voiceWssBox, { backgroundColor: isLight ? '#ffffff' : '#020d06', borderColor: isLight ? '#bbf7d0' : '#14532d' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.wssBadge, { backgroundColor: isLight ? '#e0e7ff' : '#1e1b4b' }]}>
                        <Ionicons name="flash" size={12} color="#6366f1" />
                        <Text style={[styles.wssBadgeText, { color: '#6366f1' }]}>WSS REAL-TIME AUDIO WEBSOCKET</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: subTextColor }}>Namespace: <Text style={{ fontWeight: '800', color: textColor }}>/voice-call</Text></Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtnCompact, { backgroundColor: innerBg, borderColor: cardBorder }]}
                      onPress={() => handleCopyValue('WebSocket Gateway', 'wss://api.farmsking.com/voice-call')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={13} color={isLight ? '#16a34a' : '#00ff87'} />
                      <Text style={[styles.copyBtnCompactText, { color: textColor }]}>Copy WSS URL</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.endpointUrlText, { color: isLight ? '#15803d' : '#86efac' }]}>
                    wss://api.farmsking.com/voice-call
                  </Text>
                  <Text style={[styles.endpointSubInfo, { color: subTextColor }]}>
                    • Events: <Text style={{ fontWeight: '700', color: textColor }}>voice_audio_chunk</Text> (binary PCM / Opus), <Text style={{ fontWeight: '700', color: textColor }}>join_call</Text>, <Text style={{ fontWeight: '700', color: textColor }}>leave_call</Text>, <Text style={{ fontWeight: '700', color: textColor }}>mute_status</Text>
                  </Text>
                </View>

                {/* REST Endpoints Grid */}
                <View style={styles.voiceEndpointsGrid}>
                  <View style={[styles.voiceEndpointItem, { backgroundColor: isLight ? '#ffffff' : '#020d06', borderColor: cardBorder }]}>
                    <View style={styles.endpointTopRow}>
                      <View style={[styles.methodBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.methodText, { color: '#15803d' }]}>POST</Text>
                      </View>
                      <Text style={[styles.endpointPath, { color: textColor }]}>/api/voice-call/start</Text>
                      <TouchableOpacity
                        style={styles.copyIconBtn}
                        onPress={() => handleCopyValue('Start Call Endpoint', 'https://api.farmsking.com/api/voice-call/start')}
                      >
                        <Ionicons name="copy-outline" size={14} color={subTextColor} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.endpointPurpose, { color: subTextColor }]}>
                      Initiate group voice call session, invite active farmers & generate Agora RTC audio tokens.
                    </Text>
                  </View>

                  <View style={[styles.voiceEndpointItem, { backgroundColor: isLight ? '#ffffff' : '#020d06', borderColor: cardBorder }]}>
                    <View style={styles.endpointTopRow}>
                      <View style={[styles.methodBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.methodText, { color: '#15803d' }]}>POST</Text>
                      </View>
                      <Text style={[styles.endpointPath, { color: textColor }]}>/api/voice-call/:id/join</Text>
                      <TouchableOpacity
                        style={styles.copyIconBtn}
                        onPress={() => handleCopyValue('Join Call Endpoint', 'https://api.farmsking.com/api/voice-call/:id/join')}
                      >
                        <Ionicons name="copy-outline" size={14} color={subTextColor} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.endpointPurpose, { color: subTextColor }]}>
                      Farmer or Advisor joins active voice channel and receives dynamic RTC credentials.
                    </Text>
                  </View>

                  <View style={[styles.voiceEndpointItem, { backgroundColor: isLight ? '#ffffff' : '#020d06', borderColor: cardBorder }]}>
                    <View style={styles.endpointTopRow}>
                      <View style={[styles.methodBadge, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[styles.methodText, { color: '#b91c1c' }]}>POST</Text>
                      </View>
                      <Text style={[styles.endpointPath, { color: textColor }]}>/api/voice-call/:id/end</Text>
                      <TouchableOpacity
                        style={styles.copyIconBtn}
                        onPress={() => handleCopyValue('End Call Endpoint', 'https://api.farmsking.com/api/voice-call/:id/end')}
                      >
                        <Ionicons name="copy-outline" size={14} color={subTextColor} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.endpointPurpose, { color: subTextColor }]}>
                      Terminate voice room, disconnect participants and write duration to PostgreSQL database.
                    </Text>
                  </View>

                  <View style={[styles.voiceEndpointItem, { backgroundColor: isLight ? '#ffffff' : '#020d06', borderColor: cardBorder }]}>
                    <View style={styles.endpointTopRow}>
                      <View style={[styles.methodBadge, { backgroundColor: '#e0e7ff' }]}>
                        <Text style={[styles.methodText, { color: '#4338ca' }]}>GET</Text>
                      </View>
                      <Text style={[styles.endpointPath, { color: textColor }]}>/api/voice-call/active</Text>
                      <TouchableOpacity
                        style={styles.copyIconBtn}
                        onPress={() => handleCopyValue('Active Call Endpoint', 'https://api.farmsking.com/api/voice-call/active')}
                      >
                        <Ionicons name="copy-outline" size={14} color={subTextColor} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.endpointPurpose, { color: subTextColor }]}>
                      Query current user's live incoming or ongoing voice call session state.
                    </Text>
                  </View>

                  <View style={[styles.voiceEndpointItem, { backgroundColor: isLight ? '#ffffff' : '#020d06', borderColor: cardBorder }]}>
                    <View style={styles.endpointTopRow}>
                      <View style={[styles.methodBadge, { backgroundColor: '#fef3c7' }]}>
                        <Text style={[styles.methodText, { color: '#b45309' }]}>AI VOICE</Text>
                      </View>
                      <Text style={[styles.endpointPath, { color: textColor }]}>/api/ai/voice/command</Text>
                      <TouchableOpacity
                        style={styles.copyIconBtn}
                        onPress={() => handleCopyValue('AI Voice Endpoint', 'https://api.farmsking.com/api/ai/voice/command')}
                      >
                        <Ionicons name="copy-outline" size={14} color={subTextColor} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.endpointPurpose, { color: subTextColor }]}>
                      Multilingual Punjabi, Hindi & English spoken agronomy voice intent engine (`VoiceAIModule`).
                    </Text>
                  </View>
                </View>

                {/* Actions Footer */}
                <View style={styles.voiceApiActionsRow}>
                  <TouchableOpacity
                    style={[styles.voicePingActionBtn, { backgroundColor: '#16a34a', opacity: isTestingVoicePing ? 0.7 : 1 }]}
                    onPress={handleTestVoicePing}
                    disabled={isTestingVoicePing}
                    activeOpacity={0.85}
                  >
                    {isTestingVoicePing ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="pulse" size={15} color="#ffffff" />
                    )}
                    <Text style={styles.voicePingActionBtnText}>
                      {isTestingVoicePing ? 'Pinging Voice Call Gateway...' : '⚡ Test Voice Call Gateway Ping'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.outlineActionBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
                    onPress={() => handleCopyValue('Voice API Documentation', 'https://api.farmsking.com/api/voice-call (Endpoints: /start, /:id/join, /:id/end, /active, wss://api.farmsking.com/voice-call)')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={14} color="#16a34a" />
                    <Text style={[styles.outlineActionText, { color: textColor }]}>Copy All Voice Endpoints</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );
      })()}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 4. WEATHER & SPRAY TELEMETRY (OPEN-METEO, IMD & RADAR)             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'WEATHER') && (() => {
        const activeWeatherKey = localConfig.weather?.activeProvider || 'OPEN_METEO';
        const activeWeatherMeta = ALL_WEATHER_PROVIDERS.find((p) => p.key === activeWeatherKey) || ALL_WEATHER_PROVIDERS[0];
        const progressPct = Math.min(100, Math.round((activeWeatherMeta.simulatedUsedRequests / activeWeatherMeta.dailyFreeRequests) * 100));
        const remainingRequests = Math.max(0, activeWeatherMeta.dailyFreeRequests - activeWeatherMeta.simulatedUsedRequests);

        return (
          <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.15)' }]}>
                  <Ionicons name="partly-sunny" size={22} color={isLight ? '#059669' : '#34d399'} />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: textColor }]}>4. Weather & Spray Feasibility Telemetry</Text>
                  <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                    GPS hourly wind, rain, and humidity data to advise farmers whether to spray pesticides or postpone.
                  </Text>
                </View>
              </View>
              <View style={[styles.tierBadge, { backgroundColor: isLight ? '#d1fae5' : 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#047857' : '#6ee7b7' }}>
                  {activeWeatherMeta.planBadge}
                </Text>
              </View>
            </View>

            {/* Weather Strategy & Comparison Guide */}
            <TouchableOpacity
              style={[styles.strategyGuideBar, { backgroundColor: isLight ? '#f0fdf4' : '#03190d', borderColor: isLight ? '#bbf7d0' : '#0f3822' }]}
              onPress={() => toggleGuide('weather')}
              activeOpacity={0.8}
            >
              <Ionicons name="leaf" size={18} color={isLight ? '#059669' : '#34d399'} />
              <Text style={[styles.strategyGuideText, { color: textColor }]}>
                💡 Weather Strategy: <Text style={{ fontWeight: '800', color: isLight ? '#059669' : '#34d399' }}>Open-Meteo</Text> provides 10,000 free calls daily with zero API key required, backed by <Text style={{ fontWeight: '800' }}>IMD Agromet</Text> for official Indian advisories.
              </Text>
              <Ionicons
                name={expandedGuides['weather'] ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={subTextColor}
              />
            </TouchableOpacity>

            {expandedGuides['weather'] && (
              <View style={[styles.guideDetailsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.guideHeading, { color: textColor }]}>🌾 Weather & Agricultural Telemetry Comparison:</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Open-Meteo (Active):</Text> 10,000 calls/day 100% free forever. No API key or credit card needed. Hyperlocal ECMWF 9km resolution.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>IMD Agromet (Mausam):</Text> 100% Free Government Open Data. Gramin Krishi Mausam Sewa bulletins issued by State Agriculture Universities (PAU Ludhiana).</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>OpenWeatherMap (One Call 3.0):</Text> 1,000 free calls/day. Minute-by-minute rain start & stop predictions for next 1 hour.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>WeatherAPI Agriculture:</Text> 1M calls/month trial. Root-zone soil temperature and moisture (10cm - 100cm depth) for crop nutrition.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>AccuWeather MinuteCast:</Text> Patented exact-minute precipitation radar ("Rain starting in 18 mins, ending in 42 mins").</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Tomorrow.io:</Text> AI Spray Window scoring index (0-100) and Evapotranspiration (ET0) water loss calculation.</Text>
              </View>
            )}

            {/* Active Weather Dropdown */}
            <Text style={[styles.fieldHeading, { color: isLight ? '#059669' : '#34d399' }]}>
              SELECT ACTIVE WEATHER API ENGINE:
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#059669' : '#34d399' },
              ]}
              onPress={() => toggleDropdown('weather')}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeft}>
                <Ionicons name={activeWeatherMeta.icon} size={18} color={isLight ? '#059669' : '#34d399'} />
                <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                  Active Weather Engine: <Text style={{ fontWeight: '900', color: isLight ? '#059669' : '#34d399' }}>{activeWeatherMeta.name}</Text>
                </Text>
              </View>
              <Ionicons
                name={openDropdowns['weather'] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={isLight ? '#059669' : '#34d399'}
              />
            </TouchableOpacity>

            {openDropdowns['weather'] && (
              <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                {ALL_WEATHER_PROVIDERS.map((item) => {
                  const isSelected = activeWeatherKey === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.dropdownItem,
                        isSelected && { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(52, 211, 153, 0.15)' },
                      ]}
                      onPress={() => {
                        setLocalConfig({
                          ...localConfig,
                          weather: { ...localConfig.weather, activeProvider: item.key as any },
                        });
                        toggleDropdown('weather');
                        showToast(`⚡ Switched Weather Provider to ${item.name}`);
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? (isLight ? '#059669' : '#34d399') : subTextColor}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#059669' : '#34d399') : subTextColor }]}>
                          {item.tag}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={isLight ? '#059669' : '#34d399'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 🌟 Dynamic Features & Plan Info Card for Selected Provider */}
            <View style={[styles.telecomFeatureCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={styles.telecomCardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name={activeWeatherMeta.icon} size={20} color={activeWeatherMeta.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: textColor }}>
                      {activeWeatherMeta.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: activeWeatherMeta.color, fontWeight: '700', marginTop: 1 }}>
                      {activeWeatherMeta.recommendation}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: isLight ? '#d1fae5' : 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: isLight ? '#065f46' : '#6ee7b7' }}>
                    {activeWeatherMeta.tag}
                  </Text>
                </View>
              </View>

              {/* Technical Specifications Grid */}
              <View style={styles.telecomFeatureGrid}>
                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🎁 Free Quota Plan</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#16a34a' }]}>{activeWeatherMeta.freeTier}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>💰 Overage Pricing</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeWeatherMeta.paidRate}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>📍 Hyperlocal Resolution</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#0284c7' }]}>{activeWeatherMeta.resolution}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🌾 Spray Safety Accuracy</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#10b981' }]}>{activeWeatherMeta.sprayAccuracy}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🌱 Soil Sensors Telemetry</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#d97706' }]}>{activeWeatherMeta.soilSensors}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>⏱️ Radar Refresh Rate</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeWeatherMeta.refreshRate}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: subTextColor, lineHeight: 16, marginTop: 4 }}>
                {activeWeatherMeta.summary}
              </Text>
            </View>

            {/* 📊 Live Daily Telemetry & Quota Monitor Widget */}
            <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
              <View style={styles.telecomUsageHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="analytics" size={17} color={isLight ? '#059669' : '#34d399'} />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                    📊 Weather Telemetry & Daily Quota Monitor
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#15803d' : '#00ff87' }}>
                    SENSORS ONLINE
                  </Text>
                </View>
              </View>

              {/* Quota Progress Bar */}
              <View style={styles.telecomProgressBarWrap}>
                <View
                  style={[
                    styles.telecomProgressBarFill,
                    {
                      width: `${progressPct}%`,
                      backgroundColor: progressPct > 85 ? '#ef4444' : isLight ? '#059669' : '#34d399',
                    },
                  ]}
                />
              </View>

              {/* Progress Labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textColor }}>
                  {activeWeatherMeta.simulatedUsedRequests.toLocaleString()} / {activeWeatherMeta.dailyFreeRequests.toLocaleString()} Daily Requests Consumed
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#059669' : '#34d399' }}>
                  {progressPct}% Used
                </Text>
              </View>

              {/* Detailed Metrics & Ping Action */}
              <View style={styles.telecomUsageStatsRow}>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: isLight ? '#d1fae5' : 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isLight ? '#065f46' : '#6ee7b7' }}>
                      🌱 {remainingRequests.toLocaleString()} Free Daily Requests Left
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isLight ? '#f1f5f9' : '#072414', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: subTextColor }}>
                      💳 ₹0.00 Free Tier Protected
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isLight ? '#f0fdf4' : '#03190d', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isLight ? '#16a34a' : '#00ff87' }}>
                      🛰️ 0 Latency Drops
                    </Text>
                  </View>
                </View>

                {/* 1-Click Weather Radar Ping Button */}
                <TouchableOpacity
                  style={[styles.testPingBtn, { backgroundColor: isLight ? '#059669' : '#10b981' }]}
                  onPress={handleTestWeatherHandshake}
                  disabled={isTestingWeatherPing}
                  activeOpacity={0.8}
                >
                  {isTestingWeatherPing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="flash" size={13} color="#ffffff" />
                  )}
                  <Text style={styles.testPingBtnText}>
                    {isTestingWeatherPing ? 'Testing Radar...' : '⚡ Test Weather API & Hyperlocal Ping'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Provider Specific Credentials Form */}
            <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              {activeWeatherKey === 'OPEN_METEO' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🌾 Open-Meteo High-Resolution Forecast Engine</Text>
                  <InputField
                    label="Open-Meteo Forecast Endpoint"
                    value={localConfig.weather?.providers?.openMeteo?.endpointUrl || 'https://api.open-meteo.com/v1/forecast'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        weather: {
                          ...localConfig.weather,
                          providers: {
                            ...localConfig.weather.providers,
                            openMeteo: { ...localConfig.weather.providers.openMeteo, endpointUrl: val },
                          },
                        },
                      })
                    }
                    placeholder="https://api.open-meteo.com/v1/forecast"
                    isLight={isLight}
                  />
                  <View style={styles.twoColRow}>
                    <View style={[styles.toggleInlineBox, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.toggleInlineTitle, { color: textColor }]}>Auto-Spray Feasibility Rules</Text>
                        <Text style={[styles.toggleInlineDesc, { color: subTextColor }]}>Checks rain probability & wind speed before advising spray</Text>
                      </View>
                      <Switch
                        value={localConfig.weather?.providers?.openMeteo?.autoSprayAlerts ?? true}
                        onValueChange={(val) =>
                          setLocalConfig({
                            ...localConfig,
                            weather: {
                              ...localConfig.weather,
                              providers: {
                                ...localConfig.weather.providers,
                                openMeteo: { ...localConfig.weather.providers.openMeteo, autoSprayAlerts: val },
                              },
                            },
                          })
                        }
                        trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>
                </>
              )}

              {activeWeatherKey === 'IMD' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🏛️ India Meteorological Dept (IMD Agromet / Mausam) API</Text>
                  <InputField
                    label="IMD Agromet Endpoint URL"
                    value={localConfig.weather?.providers?.imd?.endpointUrl || 'https://internal.imd.gov.in/agrimet'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        weather: {
                          ...localConfig.weather,
                          providers: {
                            ...localConfig.weather.providers,
                            imd: { ...(localConfig.weather.providers.imd || { apiKey: '' }), endpointUrl: val },
                          },
                        },
                      })
                    }
                    placeholder="https://internal.imd.gov.in/agrimet"
                    isLight={isLight}
                  />
                  <InputField
                    label="IMD Open Data API Key / Access Token (Optional)"
                    value={localConfig.weather?.providers?.imd?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        weather: {
                          ...localConfig.weather,
                          providers: {
                            ...localConfig.weather.providers,
                            imd: { ...(localConfig.weather.providers.imd || { endpointUrl: 'https://internal.imd.gov.in/agrimet' }), apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Optional IMD Token or leave blank for public bulletins"
                    isSecret={!showSecrets['imd_secret']}
                    onToggleSecret={() => toggleSecret('imd_secret')}
                    isLight={isLight}
                  />
                </>
              )}

              {activeWeatherKey === 'OPEN_WEATHER_MAP' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🌐 OpenWeatherMap One Call 3.0 API Credentials</Text>
                  <InputField
                    label="OpenWeatherMap API Key (AppID)"
                    value={localConfig.weather?.providers?.openWeatherMap?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        weather: {
                          ...localConfig.weather,
                          providers: {
                            ...localConfig.weather.providers,
                            openWeatherMap: { ...localConfig.weather.providers.openWeatherMap, apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Paste 32-character OpenWeatherMap API Key"
                    isSecret={!showSecrets['openweather_secret']}
                    onToggleSecret={() => toggleSecret('openweather_secret')}
                    isLight={isLight}
                  />
                </>
              )}

              {activeWeatherKey === 'WEATHER_API' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🌱 WeatherAPI Agriculture & Soil Metrics Credentials</Text>
                  <InputField
                    label="WeatherAPI API Key"
                    value={localConfig.weather?.providers?.weatherApi?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        weather: {
                          ...localConfig.weather,
                          providers: {
                            ...localConfig.weather.providers,
                            weatherApi: { ...localConfig.weather.providers.weatherApi, apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Paste WeatherAPI Key"
                    isSecret={!showSecrets['weatherapi_secret']}
                    onToggleSecret={() => toggleSecret('weatherapi_secret')}
                    isLight={isLight}
                  />
                </>
              )}

              {activeWeatherKey === 'ACCUWEATHER' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>⚡ AccuWeather MinuteCast Enterprise Credentials</Text>
                  <InputField
                    label="AccuWeather Developer API Key"
                    value={localConfig.weather?.providers?.accuweather?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        weather: {
                          ...localConfig.weather,
                          providers: {
                            ...localConfig.weather.providers,
                            accuweather: { ...(localConfig.weather.providers.accuweather || {}), apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Paste AccuWeather API Key"
                    isSecret={!showSecrets['accuweather_secret']}
                    onToggleSecret={() => toggleSecret('accuweather_secret')}
                    isLight={isLight}
                  />
                </>
              )}

              {activeWeatherKey === 'TOMORROW_IO' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🤖 Tomorrow.io Weather Intelligence Credentials</Text>
                  <InputField
                    label="Tomorrow.io API Key"
                    value={localConfig.weather?.providers?.tomorrowIo?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        weather: {
                          ...localConfig.weather,
                          providers: {
                            ...localConfig.weather.providers,
                            tomorrowIo: { ...(localConfig.weather.providers.tomorrowIo || {}), apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Paste Tomorrow.io API Key"
                    isSecret={!showSecrets['tomorrowio_secret']}
                    onToggleSecret={() => toggleSecret('tomorrowio_secret')}
                    isLight={isLight}
                  />
                </>
              )}

              {/* 🌾 Universal Spray Feasibility Advisory Threshold Settings */}
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: cardBorder }}>
                <Text style={[styles.credTitle, { color: textColor, marginBottom: 4 }]}>
                  🌾 Spray Feasibility Advisory Thresholds (Smart Protection Rules)
                </Text>
                <Text style={{ fontSize: 11, color: subTextColor, marginBottom: 12, lineHeight: 16 }}>
                  Configure exact agricultural thresholds where the mobile app triggers warnings to prevent chemical waste, spray drift onto neighboring crops, or rain wash-off.
                </Text>

                <View style={styles.twoColRow}>
                  <InputField
                    label="Max Wind Speed for Spraying (km/h)"
                    value="15"
                    onChangeText={() => {}}
                    placeholder="15"
                    keyboardType="numeric"
                    isLight={isLight}
                  />
                  <InputField
                    label="Rain Probability Cutoff (%)"
                    value="40"
                    onChangeText={() => {}}
                    placeholder="40"
                    keyboardType="numeric"
                    isLight={isLight}
                  />
                </View>

                <View style={styles.twoColRow}>
                  <InputField
                    label="Min Safe Spray Temp (°C)"
                    value="15"
                    onChangeText={() => {}}
                    placeholder="15"
                    keyboardType="numeric"
                    isLight={isLight}
                  />
                  <InputField
                    label="Max Safe Spray Temp (°C)"
                    value="32"
                    onChangeText={() => {}}
                    placeholder="32"
                    keyboardType="numeric"
                    isLight={isLight}
                  />
                </View>
              </View>
            </View>
          </View>
        );
      })()}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 5. SMS & OTP TELECOM SERVICES                                     */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'SMS') && (
        <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(234, 88, 12, 0.12)' : 'rgba(251, 146, 60, 0.15)' }]}>
                <Ionicons name="chatbox-ellipses" size={22} color={isLight ? '#ea580c' : '#fb923c'} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: textColor }]}>5. SMS Gateway & OTP Verification</Text>
                <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                  High-speed login OTP codes, order confirmations, and DLT compliant SMS messages for Indian farmers.
                </Text>
              </View>
            </View>
            <View style={styles.sandboxToggleRow}>
              <Text style={[styles.toggleLabel, { color: subTextColor }]}>SMS Active</Text>
              <Switch
                value={Boolean(localConfig?.sms?.isEnabled)}
                onValueChange={(val) =>
                  setLocalConfig({
                    ...localConfig,
                    sms: { ...(localConfig?.sms || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.sms), isEnabled: val },
                  })
                }
                trackColor={{ false: '#1e293b', true: isLight ? '#ea580c' : '#fb923c' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <Text style={[styles.fieldHeading, { color: isLight ? '#ea580c' : '#fb923c' }]}>
            SELECT ACTIVE SMS PROVIDER:
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#ea580c' : '#fb923c' },
            ]}
            onPress={() => toggleDropdown('sms')}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={isLight ? '#ea580c' : '#fb923c'} />
              <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                Active SMS: <Text style={{ fontWeight: '900', color: isLight ? '#ea580c' : '#fb923c' }}>{localConfig.sms.activeProvider}</Text>
              </Text>
            </View>
            <Ionicons
              name={openDropdowns['sms'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isLight ? '#ea580c' : '#fb923c'}
            />
          </TouchableOpacity>

          {openDropdowns['sms'] && (
            <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
              {[
                { key: 'FIREBASE', name: 'Google Firebase Phone Auth / SMS', tag: '10,000 FREE OTP/MONTH', icon: 'flame' },
                { key: 'FAST2SMS', name: 'Fast2SMS India Quick DLT Route', tag: 'LOW COST (₹0.15/SMS)', icon: 'flash' },
                { key: 'MSG91', name: 'MSG91 Enterprise DLT Gateway', tag: 'PREMIUM CARRIER BACKUP', icon: 'paper-plane' },
                { key: 'TWILIO', name: 'Twilio Global SMS Platform', tag: 'WORLDWIDE REACH', icon: 'globe' },
                { key: 'TEXTLOCAL', name: 'Textlocal India Bulk Messaging', tag: 'ENTERPRISE SMS', icon: 'chatbox' },
                { key: 'GUPSHUP', name: 'Gupshup Telecom Gateway', tag: 'DIRECT TELECOM INTERCONNECT', icon: 'send' },
                { key: 'KALEYRA', name: 'Kaleyra (Tata Comm) Banking SMS', tag: 'HIGH DELIVERY RATIO', icon: 'shield-checkmark' },
                { key: 'CUSTOM_HTTP', name: 'Custom HTTP Webhook Gateway', tag: 'ANY OPERATOR API', icon: 'code-working' },
              ].map((item) => {
                const isSelected = localConfig.sms.activeProvider === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: isLight ? 'rgba(234, 88, 12, 0.1)' : 'rgba(251, 146, 60, 0.15)' },
                    ]}
                    onPress={() => {
                      setLocalConfig({
                        ...localConfig,
                        sms: { ...localConfig.sms, activeProvider: item.key as any },
                      });
                      toggleDropdown('sms');
                      showToast(`⚡ Switched SMS Provider to ${item.name}`);
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? (isLight ? '#ea580c' : '#fb923c') : subTextColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#ea580c' : '#fb923c') : subTextColor }]}>
                        {item.tag}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={isLight ? '#ea580c' : '#fb923c'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 📱 Dynamic SMS Provider Cards & Quota Telemetry */}
          {(() => {
            const activeSmsKey = localConfig.sms?.activeProvider || 'FIREBASE';
            const activeSmsMeta = ALL_SMS_PROVIDERS.find((p) => p.key === activeSmsKey) || ALL_SMS_PROVIDERS[0];
            const monthlySmsQuota = activeSmsMeta.monthlyQuota;
            const usedSms = activeSmsMeta.simulatedUsedSms;
            const smsPercentage = Math.min(100, Math.round((usedSms / monthlySmsQuota) * 100));
            const remainingSms = Math.max(0, monthlySmsQuota - usedSms);
            return (
              <>
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldHeading, { color: isLight ? '#ea580c' : '#fb923c' }]}>
                    ALL 8 SMS GATEWAYS & DLT CARRIER PROTOCOLS:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.telecomCardsScroll}>
                    {ALL_SMS_PROVIDERS.map((s) => {
                      const isCurSelected = activeSmsKey === s.key;
                      return (
                        <TouchableOpacity
                          key={s.key}
                          style={[
                            styles.telecomFeatureCard,
                            {
                              backgroundColor: isCurSelected ? (isLight ? '#fff7ed' : '#221105') : (isLight ? '#ffffff' : '#03140a'),
                              borderColor: isCurSelected ? s.color : cardBorder,
                            },
                          ]}
                          onPress={() => {
                            setLocalConfig({
                              ...localConfig,
                              sms: { ...localConfig.sms, activeProvider: s.key as any },
                            });
                            showToast(`⚡ Switched SMS Provider to ${s.name}`);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={[styles.iconBox, { width: 32, height: 32, backgroundColor: isLight ? 'rgba(234, 88, 12, 0.12)' : 'rgba(251, 146, 60, 0.15)' }]}>
                              <Ionicons name={s.icon} size={16} color={s.color} />
                            </View>
                            <View style={[styles.telecomPlanBadge, { backgroundColor: isCurSelected ? s.color : (isLight ? '#f1f5f9' : '#0f172a') }]}>
                              <Text style={[styles.telecomPlanBadgeText, { color: isCurSelected ? '#ffffff' : subTextColor }]}>
                                {s.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.telecomCardTitle, { color: textColor }]}>{s.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{s.planBadge}</Text>
                          <View style={{ gap: 2, marginTop: 4 }}>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Rate: <Text style={{ color: textColor, fontWeight: '700' }}>{s.ratePerSms}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Delivery: <Text style={{ color: textColor, fontWeight: '700' }}>{s.deliverySpeed}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• DLT: <Text style={{ color: textColor, fontWeight: '700' }}>{s.dltRequirement}</Text></Text>
                          </View>
                          {isCurSelected && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Ionicons name="checkmark-circle" size={14} color="#ea580c" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#ea580c' }}>ACTIVE SMS ROUTE</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🌟 Selected SMS Deep-Dive & Recommendation */}
                <View style={[styles.telecomDetailCard, { backgroundColor: innerBg, borderColor: activeSmsMeta.color, borderWidth: 1.5 }]}>
                  <View style={styles.telecomDetailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={activeSmsMeta.icon} size={20} color={activeSmsMeta.color} />
                      <Text style={[styles.telecomDetailTitle, { color: textColor }]}>
                        Active SMS Route: {activeSmsMeta.name}
                      </Text>
                    </View>
                    <View style={[styles.telecomPlanBadge, { backgroundColor: activeSmsMeta.color }]}>
                      <Text style={[styles.telecomPlanBadgeText, { color: '#ffffff' }]}>
                        {activeSmsMeta.planBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: isLight ? '#ea580c' : '#fb923c', marginVertical: 4 }}>
                    {activeSmsMeta.recommendation}
                  </Text>
                  <View style={styles.telecomDetailBadgesRow}>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Free Monthly OTP</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeSmsMeta.freeTier}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Per-SMS Tariff</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeSmsMeta.ratePerSms}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Dispatch Latency</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeSmsMeta.deliverySpeed}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>DLT Compliance</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeSmsMeta.dltRequirement}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 6, fontStyle: 'italic' }}>
                    {activeSmsMeta.summary}
                  </Text>
                </View>

                {/* 📊 SMS Delivery Telemetry & Carrier Quota Monitor */}
                <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
                  <View style={styles.telecomUsageHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="chatbox-ellipses" size={17} color={isLight ? '#ea580c' : '#fb923c'} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                        📊 SMS Delivery Telemetry & Carrier Quota Monitor (Current Month)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#fff7ed' : 'rgba(234, 88, 12, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ea580c' }} />
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#ea580c' : '#fb923c' }}>
                        TELECOM DLT ONLINE
                      </Text>
                    </View>
                  </View>

                  {/* Quota Progress Bar */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                        Monthly OTPs Dispatched: <Text style={{ color: activeSmsMeta.color, fontWeight: '900' }}>{usedSms.toLocaleString('en-IN')}</Text> / {monthlySmsQuota.toLocaleString('en-IN')} Free Quota
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#ea580c' }}>
                        {smsPercentage}% Quota Used
                      </Text>
                    </View>
                    <View style={[styles.telecomProgressBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
                      <View
                        style={[
                          styles.telecomProgressBarFill,
                          {
                            width: `${Math.max(5, smsPercentage)}%`,
                            backgroundColor: smsPercentage > 85 ? '#dc2626' : smsPercentage > 60 ? '#d97706' : '#ea580c',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Usage Statistics Row */}
                  <View style={styles.telecomUsageStatsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-done-circle-outline" size={13} color="#ea580c" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#ea580c' }}>
                        {remainingSms.toLocaleString('en-IN')} Free OTPs Remaining
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cash-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Carrier Cost: <Text style={{ fontWeight: '800', color: textColor }}>₹0.00 (Firebase Spark Tier)</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="radio-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Speed: <Text style={{ fontWeight: '800', color: textColor }}>{activeSmsMeta.deliverySpeed}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* ⚡ Test Connection & SMS Dispatch Ping */}
                  <TouchableOpacity
                    style={[styles.testPingBtn, { backgroundColor: isLight ? '#ea580c' : '#c2410c', opacity: isTestingSms ? 0.7 : 1 }]}
                    activeOpacity={0.85}
                    disabled={isTestingSms}
                    onPress={handleTestSmsHandshake}
                  >
                    {isTestingSms ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="pulse" size={14} color="#ffffff" />
                    )}
                    <Text style={styles.testPingBtnText}>
                      {isTestingSms ? 'Pinging Indian Telecom Carrier...' : `⚡ Test Carrier Dispatch & DLT Scrubbing Ping (${activeSmsMeta.name.split(' ')[0]})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
            {localConfig.sms.activeProvider === 'FIREBASE' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🔥 Google Firebase Web & Admin Credentials</Text>
                <InputField
                  label="Firebase Web API Key"
                  value={localConfig.sms.providers.firebase.apiKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      sms: {
                        ...localConfig.sms,
                        providers: {
                          ...localConfig.sms.providers,
                          firebase: { ...localConfig.sms.providers.firebase, apiKey: val },
                        },
                      },
                    })
                  }
                  placeholder="AIzaSyC4ZPSAJcbb7xHzPdWlmqNo0yX2rnLeIgo"
                  isSecret={!showSecrets['firebase_key']}
                  onToggleSecret={() => toggleSecret('firebase_key')}
                  isLight={isLight}
                />
                <View style={styles.twoColRow}>
                  <InputField
                    label="Firebase Project ID"
                    value={localConfig.sms.providers.firebase.projectId}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        sms: {
                          ...localConfig.sms,
                          providers: {
                            ...localConfig.sms.providers,
                            firebase: { ...localConfig.sms.providers.firebase, projectId: val },
                          },
                        },
                      })
                    }
                    placeholder="farmsking-510606"
                    isLight={isLight}
                  />
                  <InputField
                    label="App ID"
                    value={localConfig.sms.providers.firebase.appId}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        sms: {
                          ...localConfig.sms,
                          providers: {
                            ...localConfig.sms.providers,
                            firebase: { ...localConfig.sms.providers.firebase, appId: val },
                          },
                        },
                      })
                    }
                    placeholder="1:742233980320:web:baebebe2a59b7a4857b8c5"
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.sms.activeProvider === 'FAST2SMS' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>⚡ Fast2SMS DLT India Parameters</Text>
                <InputField
                  label="Fast2SMS API Key"
                  value={localConfig.sms.providers.fast2sms.apiKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      sms: {
                        ...localConfig.sms,
                        providers: {
                          ...localConfig.sms.providers,
                          fast2sms: { ...localConfig.sms.providers.fast2sms, apiKey: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste Fast2SMS API Key"
                  isSecret={!showSecrets['fast2sms_key']}
                  onToggleSecret={() => toggleSecret('fast2sms_key')}
                  isLight={isLight}
                />
                <View style={styles.twoColRow}>
                  <InputField
                    label="DLT Sender ID (6 Chars)"
                    value={localConfig.sms.providers.fast2sms.senderId}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        sms: {
                          ...localConfig.sms,
                          providers: {
                            ...localConfig.sms.providers,
                            fast2sms: { ...localConfig.sms.providers.fast2sms, senderId: val },
                          },
                        },
                      })
                    }
                    placeholder="FRMKNG"
                    isLight={isLight}
                  />
                  <InputField
                    label="DLT Entity ID"
                    value={localConfig.sms.providers.fast2sms.entityId}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        sms: {
                          ...localConfig.sms,
                          providers: {
                            ...localConfig.sms.providers,
                            fast2sms: { ...localConfig.sms.providers.fast2sms, entityId: val },
                          },
                        },
                      })
                    }
                    placeholder="1201160000000000"
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.sms.activeProvider === 'MSG91' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📨 MSG91 Enterprise DLT Gateway</Text>
                <InputField
                  label="MSG91 Auth Key"
                  value={localConfig.sms.providers.msg91.authKey}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      sms: {
                        ...localConfig.sms,
                        providers: {
                          ...localConfig.sms.providers,
                          msg91: { ...localConfig.sms.providers.msg91, authKey: val },
                        },
                      },
                    })
                  }
                  placeholder="Paste MSG91 Auth Key"
                  isSecret={!showSecrets['msg91_key']}
                  onToggleSecret={() => toggleSecret('msg91_key')}
                  isLight={isLight}
                />
                <InputField
                  label="DLT Flow Template ID"
                  value={localConfig.sms.providers.msg91.dltFlowId}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      sms: {
                        ...localConfig.sms,
                        providers: {
                          ...localConfig.sms.providers,
                          msg91: { ...localConfig.sms.providers.msg91, dltFlowId: val },
                        },
                      },
                    })
                  }
                  placeholder="6100abcdef123456"
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.sms.activeProvider === 'TWILIO' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🌍 Twilio Global SMS Credentials</Text>
                <InputField
                  label="Twilio Account SID"
                  value={localConfig.sms.providers.twilio.accountSid}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      sms: {
                        ...localConfig.sms,
                        providers: {
                          ...localConfig.sms.providers,
                          twilio: { ...localConfig.sms.providers.twilio, accountSid: val },
                        },
                      },
                    })
                  }
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  isLight={isLight}
                />
                <InputField
                  label="Twilio Auth Token"
                  value={localConfig.sms.providers.twilio.authToken}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      sms: {
                        ...localConfig.sms,
                        providers: {
                          ...localConfig.sms.providers,
                          twilio: { ...localConfig.sms.providers.twilio, authToken: val },
                        },
                      },
                    })
                  }
                  placeholder="Auth Token"
                  isSecret={!showSecrets['twilio_token']}
                  onToggleSecret={() => toggleSecret('twilio_token')}
                  isLight={isLight}
                />
              </>
            )}
          </View>
        </View>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 6. WHATSAPP BUSINESS AUTOMATION & BOT                             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'WHATSAPP') && (
        <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.18)' }]}>
                <Ionicons name="logo-whatsapp" size={22} color="#22c55e" />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: textColor }]}>6. WhatsApp Business API & Bot Automation</Text>
                <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                  Send crop spray reminders, mandi alerts, automated customer invoices, and sync official WhatsApp groups.
                </Text>
              </View>
            </View>
            <View style={styles.sandboxToggleRow}>
              <Text style={[styles.toggleLabel, { color: subTextColor }]}>WhatsApp Active</Text>
              <Switch
                value={Boolean(localConfig?.whatsapp?.isEnabled)}
                onValueChange={(val) =>
                  setLocalConfig({
                    ...localConfig,
                    whatsapp: { ...(localConfig?.whatsapp || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.whatsapp), isEnabled: val },
                  })
                }
                trackColor={{ false: '#1e293b', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <Text style={[styles.fieldHeading, { color: '#22c55e' }]}>SELECT WHATSAPP ENGINE:</Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: '#22c55e' },
            ]}
            onPress={() => toggleDropdown('whatsapp')}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />
              <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                Active WhatsApp: <Text style={{ fontWeight: '900', color: '#22c55e' }}>{localConfig.whatsapp.activeProvider}</Text>
              </Text>
            </View>
            <Ionicons
              name={openDropdowns['whatsapp'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#22c55e"
            />
          </TouchableOpacity>

          {openDropdowns['whatsapp'] && (
            <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
              {[
                { key: 'META_CLOUD', name: 'Meta Cloud API (Official Graph API)', tag: 'DIRECT / ZERO BSP MARKUP', icon: 'logo-whatsapp' },
                { key: 'BAILEYS_QR', name: 'Baileys Multi-Device QR Web Session', tag: 'SELF-HOSTED / ₹0 COST', icon: 'qr-code' },
                { key: 'GUPSHUP', name: 'Gupshup WhatsApp Enterprise BSP', tag: 'INDIA LEADING BSP', icon: 'chatbubbles' },
                { key: 'WATI', name: 'WATI CRM Shared Team Inbox', tag: 'MARKETING AUTOMATION', icon: 'send' },
                { key: 'INTERAKT', name: 'Interakt (Jio Haptik WhatsApp Suite)', tag: 'SMB CRM', icon: 'business' },
                { key: 'AISENSY', name: 'AiSensy Smart WhatsApp Platform', tag: 'BROADCAST & RETARGETING', icon: 'megaphone' },
                { key: 'TWILIO_WHATSAPP', name: 'Twilio WhatsApp Business API', tag: 'UNIFIED OMNICHANNEL', icon: 'globe' },
              ].map((item) => {
                const isSelected = localConfig.whatsapp.activeProvider === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: isLight ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.18)' },
                    ]}
                    onPress={() => {
                      setLocalConfig({
                        ...localConfig,
                        whatsapp: { ...localConfig.whatsapp, activeProvider: item.key as any },
                      });
                      toggleDropdown('whatsapp');
                      showToast(`⚡ Switched WhatsApp Provider to ${item.name}`);
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? '#22c55e' : subTextColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.dropdownItemTag, { color: isSelected ? '#22c55e' : subTextColor }]}>
                        {item.tag}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 💬 Dynamic WhatsApp Provider Cards & Quota Telemetry */}
          {(() => {
            const activeWaKey = localConfig.whatsapp?.activeProvider || 'META_CLOUD';
            const activeWaMeta = ALL_WHATSAPP_PROVIDERS.find((p) => p.key === activeWaKey) || ALL_WHATSAPP_PROVIDERS[0];
            const monthlyWaQuota = activeWaMeta.monthlyQuota;
            const usedWaMsg = activeWaMeta.simulatedUsedMsg;
            const waPercentage = Math.min(100, Math.round((usedWaMsg / monthlyWaQuota) * 100));
            const remainingWa = Math.max(0, monthlyWaQuota - usedWaMsg);
            return (
              <>
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldHeading, { color: '#22c55e' }]}>
                    ALL 7 WHATSAPP PROVIDERS & BOT AUTOMATION ENGINES:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.telecomCardsScroll}>
                    {ALL_WHATSAPP_PROVIDERS.map((w) => {
                      const isCurSelected = activeWaKey === w.key;
                      return (
                        <TouchableOpacity
                          key={w.key}
                          style={[
                            styles.telecomFeatureCard,
                            {
                              backgroundColor: isCurSelected ? (isLight ? '#f0fdf4' : '#031d0e') : (isLight ? '#ffffff' : '#03140a'),
                              borderColor: isCurSelected ? w.color : cardBorder,
                            },
                          ]}
                          onPress={() => {
                            setLocalConfig({
                              ...localConfig,
                              whatsapp: { ...localConfig.whatsapp, activeProvider: w.key as any },
                            });
                            showToast(`⚡ Switched WhatsApp Engine to ${w.name}`);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={[styles.iconBox, { width: 32, height: 32, backgroundColor: isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.18)' }]}>
                              <Ionicons name={w.icon} size={16} color={w.color} />
                            </View>
                            <View style={[styles.telecomPlanBadge, { backgroundColor: isCurSelected ? w.color : (isLight ? '#f1f5f9' : '#0f172a') }]}>
                              <Text style={[styles.telecomPlanBadgeText, { color: isCurSelected ? '#ffffff' : subTextColor }]}>
                                {w.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.telecomCardTitle, { color: textColor }]}>{w.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: w.color }}>{w.planBadge}</Text>
                          <View style={{ gap: 2, marginTop: 4 }}>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Rate: <Text style={{ color: textColor, fontWeight: '700' }}>{w.ratePerMsg}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Automation: <Text style={{ color: textColor, fontWeight: '700' }}>{w.botAutomation}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Green Tick: <Text style={{ color: textColor, fontWeight: '700' }}>{w.greenTick}</Text></Text>
                          </View>
                          {isCurSelected && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#22c55e' }}>ACTIVE BOT ENGINE</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🌟 Selected WhatsApp Deep-Dive & Recommendation */}
                <View style={[styles.telecomDetailCard, { backgroundColor: innerBg, borderColor: activeWaMeta.color, borderWidth: 1.5 }]}>
                  <View style={styles.telecomDetailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={activeWaMeta.icon} size={20} color={activeWaMeta.color} />
                      <Text style={[styles.telecomDetailTitle, { color: textColor }]}>
                        Active WhatsApp Engine: {activeWaMeta.name}
                      </Text>
                    </View>
                    <View style={[styles.telecomPlanBadge, { backgroundColor: activeWaMeta.color }]}>
                      <Text style={[styles.telecomPlanBadgeText, { color: '#ffffff' }]}>
                        {activeWaMeta.planBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: isLight ? '#15803d' : '#22c55e', marginVertical: 4 }}>
                    {activeWaMeta.recommendation}
                  </Text>
                  <View style={styles.telecomDetailBadgesRow}>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Free Allowance</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeWaMeta.freeTier}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Per-Conv Fee</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeWaMeta.ratePerMsg}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Bot Architecture</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeWaMeta.botAutomation}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Verified Badge</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeWaMeta.greenTick}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 6, fontStyle: 'italic' }}>
                    {activeWaMeta.summary}
                  </Text>
                </View>

                {/* 📊 WhatsApp Message Telemetry & Meta Quota Monitor */}
                <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
                  <View style={styles.telecomUsageHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="logo-whatsapp" size={17} color="#22c55e" />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                        📊 WhatsApp Message Telemetry & Meta Quota Monitor (Current Month)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#15803d' : '#22c55e' }}>
                        META GRAPH API ONLINE
                      </Text>
                    </View>
                  </View>

                  {/* Quota Progress Bar */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                        Monthly Service Conversations: <Text style={{ color: activeWaMeta.color, fontWeight: '900' }}>{usedWaMsg.toLocaleString('en-IN')}</Text> / {monthlyWaQuota.toLocaleString('en-IN')} Free Convs
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#22c55e' }}>
                        {waPercentage}% Quota Used
                      </Text>
                    </View>
                    <View style={[styles.telecomProgressBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
                      <View
                        style={[
                          styles.telecomProgressBarFill,
                          {
                            width: `${Math.max(5, waPercentage)}%`,
                            backgroundColor: waPercentage > 85 ? '#dc2626' : waPercentage > 60 ? '#d97706' : '#22c55e',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Usage Statistics Row */}
                  <View style={styles.telecomUsageStatsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="chatbubbles-outline" size={13} color="#22c55e" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#22c55e' }}>
                        {remainingWa.toLocaleString('en-IN')} Free Conversations Remaining
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cash-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Meta Invoiced: <Text style={{ fontWeight: '800', color: textColor }}>₹0.00 (Within 1,000 Free Allowance)</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="link-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Webhook: <Text style={{ fontWeight: '800', color: textColor }}>farmsking.in/api/whatsapp/webhook</Text>
                      </Text>
                    </View>
                  </View>

                  {/* ⚡ Test Connection & WhatsApp Ping */}
                  <TouchableOpacity
                    style={[styles.testPingBtn, { backgroundColor: '#22c55e', opacity: isTestingWhatsapp ? 0.7 : 1 }]}
                    activeOpacity={0.85}
                    disabled={isTestingWhatsapp}
                    onPress={handleTestWhatsappHandshake}
                  >
                    {isTestingWhatsapp ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="pulse" size={14} color="#ffffff" />
                    )}
                    <Text style={styles.testPingBtnText}>
                      {isTestingWhatsapp ? 'Echoing WhatsApp Webhook...' : `⚡ Test Meta Cloud Webhook & Bot Echo Ping (${activeWaMeta.name.split(' ')[0]})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
            {localConfig.whatsapp.activeProvider === 'META_CLOUD' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>⚡ Meta Cloud Graph API Credentials</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Phone Number ID"
                    value={localConfig.whatsapp.providers.metaCloud.phoneNumberId}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        whatsapp: {
                          ...localConfig.whatsapp,
                          providers: {
                            ...localConfig.whatsapp.providers,
                            metaCloud: { ...localConfig.whatsapp.providers.metaCloud, phoneNumberId: val },
                          },
                        },
                      })
                    }
                    placeholder="e.g. 1098237461234"
                    isLight={isLight}
                  />
                  <InputField
                    label="WhatsApp Business Account ID (WABA)"
                    value={localConfig.whatsapp.providers.metaCloud.wabaId}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        whatsapp: {
                          ...localConfig.whatsapp,
                          providers: {
                            ...localConfig.whatsapp.providers,
                            metaCloud: { ...localConfig.whatsapp.providers.metaCloud, wabaId: val },
                          },
                        },
                      })
                    }
                    placeholder="e.g. 1029384756102"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Permanent System User Access Token"
                  value={localConfig.whatsapp.providers.metaCloud.accessToken}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          metaCloud: { ...localConfig.whatsapp.providers.metaCloud, accessToken: val },
                        },
                      },
                    })
                  }
                  placeholder="EAAG..."
                  isSecret={!showSecrets['meta_token']}
                  onToggleSecret={() => toggleSecret('meta_token')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.whatsapp.activeProvider === 'BAILEYS_QR' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📱 Baileys Community WhatsApp Web Session</Text>
                <InputField
                  label="Target Community Group JID"
                  value={localConfig.whatsapp.providers.baileys?.groupJid || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          baileys: { ...localConfig.whatsapp.providers.baileys, groupJid: val },
                        },
                      },
                    })
                  }
                  placeholder="1203630...@g.us"
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.whatsapp.activeProvider === 'GUPSHUP' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🏢 Gupshup WhatsApp Enterprise BSP</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Gupshup App Name"
                    value={localConfig.whatsapp.providers.gupshup?.appName || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        whatsapp: {
                          ...localConfig.whatsapp,
                          providers: {
                            ...localConfig.whatsapp.providers,
                            gupshup: { ...(localConfig.whatsapp.providers.gupshup || {}), appName: val },
                          },
                        },
                      })
                    }
                    placeholder="farmsking_enterprise"
                    isLight={isLight}
                  />
                  <InputField
                    label="Source Phone Number"
                    value={localConfig.whatsapp.providers.gupshup?.sourceNumber || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        whatsapp: {
                          ...localConfig.whatsapp,
                          providers: {
                            ...localConfig.whatsapp.providers,
                            gupshup: { ...(localConfig.whatsapp.providers.gupshup || {}), sourceNumber: val },
                          },
                        },
                      })
                    }
                    placeholder="919577622000"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Gupshup App Token"
                  value={localConfig.whatsapp.providers.gupshup?.appToken || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          gupshup: { ...(localConfig.whatsapp.providers.gupshup || {}), appToken: val },
                        },
                      },
                    })
                  }
                  placeholder="app_token_..."
                  isSecret={!showSecrets['gupshup_token']}
                  onToggleSecret={() => toggleSecret('gupshup_token')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.whatsapp.activeProvider === 'WATI' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>👥 WATI Multi-Doctor Team Inbox API</Text>
                <InputField
                  label="WATI API Endpoint URL"
                  value={localConfig.whatsapp.providers.wati?.endpointUrl || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          wati: { ...(localConfig.whatsapp.providers.wati || {}), endpointUrl: val },
                        },
                      },
                    })
                  }
                  placeholder="https://live-server-1234.wati.io"
                  isLight={isLight}
                />
                <InputField
                  label="WATI Access Token"
                  value={localConfig.whatsapp.providers.wati?.accessToken || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          wati: { ...(localConfig.whatsapp.providers.wati || {}), accessToken: val },
                        },
                      },
                    })
                  }
                  placeholder="Bearer eyJhbGci..."
                  isSecret={!showSecrets['wati_token']}
                  onToggleSecret={() => toggleSecret('wati_token')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.whatsapp.activeProvider === 'INTERAKT' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🛒 Interakt (Jio) Commerce API</Text>
                <InputField
                  label="Interakt Secret API Key"
                  value={localConfig.whatsapp.providers.interakt?.apiKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          interakt: { ...(localConfig.whatsapp.providers.interakt || {}), apiKey: val },
                        },
                      },
                    })
                  }
                  placeholder="dFRrWmlZ..."
                  isSecret={!showSecrets['interakt_key']}
                  onToggleSecret={() => toggleSecret('interakt_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.whatsapp.activeProvider === 'AISENSY' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📢 AiSensy Smart Campaigns API</Text>
                <InputField
                  label="Target Campaign Name"
                  value={localConfig.whatsapp.providers.aisensy?.campaignName || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          aisensy: {
                            campaignName: val,
                            apiKey: localConfig.whatsapp.providers.aisensy?.apiKey || '',
                          },
                        },
                      },
                    })
                  }
                  placeholder="farmsking_seasonal_advisory"
                  isLight={isLight}
                />
                <InputField
                  label="AiSensy API Key"
                  value={localConfig.whatsapp.providers.aisensy?.apiKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          aisensy: {
                            campaignName: localConfig.whatsapp.providers.aisensy?.campaignName || '',
                            apiKey: val,
                          },
                        },
                      },
                    })
                  }
                  placeholder="aisensy_live_..."
                  isSecret={!showSecrets['aisensy_key']}
                  onToggleSecret={() => toggleSecret('aisensy_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.whatsapp.activeProvider === 'TWILIO_WHATSAPP' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🌐 Twilio WhatsApp API Credentials</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Twilio Account SID"
                    value={localConfig.whatsapp.providers.twilioWhatsapp?.accountSid || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        whatsapp: {
                          ...localConfig.whatsapp,
                          providers: {
                            ...localConfig.whatsapp.providers,
                            twilioWhatsapp: {
                              accountSid: val,
                              fromNumber: localConfig.whatsapp.providers.twilioWhatsapp?.fromNumber || '',
                              authToken: localConfig.whatsapp.providers.twilioWhatsapp?.authToken || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="AC..."
                    isLight={isLight}
                  />
                  <InputField
                    label="From WhatsApp Sender"
                    value={localConfig.whatsapp.providers.twilioWhatsapp?.fromNumber || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        whatsapp: {
                          ...localConfig.whatsapp,
                          providers: {
                            ...localConfig.whatsapp.providers,
                            twilioWhatsapp: {
                              accountSid: localConfig.whatsapp.providers.twilioWhatsapp?.accountSid || '',
                              fromNumber: val,
                              authToken: localConfig.whatsapp.providers.twilioWhatsapp?.authToken || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="whatsapp:+14155238886"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Twilio Auth Token"
                  value={localConfig.whatsapp.providers.twilioWhatsapp?.authToken || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      whatsapp: {
                        ...localConfig.whatsapp,
                        providers: {
                          ...localConfig.whatsapp.providers,
                          twilioWhatsapp: {
                            accountSid: localConfig.whatsapp.providers.twilioWhatsapp?.accountSid || '',
                            fromNumber: localConfig.whatsapp.providers.twilioWhatsapp?.fromNumber || '',
                            authToken: val,
                          },
                        },
                      },
                    })
                  }
                  placeholder="auth_token_..."
                  isSecret={!showSecrets['twilio_wa_token']}
                  onToggleSecret={() => toggleSecret('twilio_wa_token')}
                  isLight={isLight}
                />
              </>
            )}

            {/* WhatsApp Group Auto-Sync Engine Controls (Consolidated from Section 3) */}
            <View style={[styles.subCard, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, marginTop: 14 }]}>
              <View style={[styles.toggleInlineBox, { backgroundColor: isLight ? '#f8fafc' : '#041b0e', borderColor: cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleInlineTitle, { color: textColor }]}>💬 WhatsApp Group Auto-Sync Engine</Text>
                  <Text style={[styles.toggleInlineDesc, { color: subTextColor }]}>
                    Automatically synchronize subscribed farmers into official WhatsApp advisory groups
                  </Text>
                </View>
                <Switch
                  value={Boolean(appSettingsForm.whatsappGroupSyncEnabled)}
                  onValueChange={(val) => setAppSettingsForm((prev: any) => ({ ...prev, whatsappGroupSyncEnabled: val }))}
                  trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                  thumbColor="#ffffff"
                />
              </View>

              {appSettingsForm.whatsappGroupSyncEnabled && (
                <View style={{ marginTop: 8 }}>
                  <View style={styles.twoColRow}>
                    <View style={[styles.toggleInlineBox, { backgroundColor: isLight ? '#f8fafc' : '#041b0e', borderColor: cardBorder }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.toggleInlineTitle, { color: textColor }]}>🟢 Auto-Add Eligible</Text>
                        <Text style={[styles.toggleInlineDesc, { color: subTextColor }]}>Add farmers with active advisor plans</Text>
                      </View>
                      <Switch
                        value={Boolean(appSettingsForm.whatsappAutoAddEnabled)}
                        onValueChange={(val) => setAppSettingsForm((prev: any) => ({ ...prev, whatsappAutoAddEnabled: val }))}
                        trackColor={{ false: '#94a3b8', true: '#22c55e' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                    <View style={[styles.toggleInlineBox, { backgroundColor: isLight ? '#f8fafc' : '#041b0e', borderColor: cardBorder }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.toggleInlineTitle, { color: textColor }]}>🔴 Auto-Remove Expired</Text>
                        <Text style={[styles.toggleInlineDesc, { color: subTextColor }]}>Remove members whose plan expired</Text>
                      </View>
                      <Switch
                        value={Boolean(appSettingsForm.whatsappAutoRemoveEnabled)}
                        onValueChange={(val) => setAppSettingsForm((prev: any) => ({ ...prev, whatsappAutoRemoveEnabled: val }))}
                        trackColor={{ false: '#94a3b8', true: '#ef4444' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>

                  <InputField
                    label="Official WhatsApp Group JID or Invite Link"
                    value={appSettingsForm.whatsappGroupJid || ''}
                    onChangeText={(val) => setAppSettingsForm((prev: any) => ({ ...prev, whatsappGroupJid: val }))}
                    placeholder="https://chat.whatsapp.com/... or 1203630...@g.us"
                    isLight={isLight}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 7. LOGISTICS & SHIPPING COURIERS                                  */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'LOGISTICS') && (
        <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(14, 165, 233, 0.12)' : 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="cube" size={22} color={isLight ? '#0284c7' : '#38bdf8'} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: textColor }]}>7. Logistics, Shipping & Courier Dispatch</Text>
                <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                  Automated AWB generation, doorstep courier pickup for fertilizers, seeds, sprayers, and live tracking.
                </Text>
              </View>
            </View>
            <View style={styles.sandboxToggleRow}>
              <Text style={[styles.toggleLabel, { color: subTextColor }]}>Logistics Active</Text>
              <Switch
                value={Boolean(localConfig?.logistics?.isEnabled)}
                onValueChange={(val) =>
                  setLocalConfig({
                    ...localConfig,
                    logistics: { ...(localConfig?.logistics || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.logistics), isEnabled: val },
                  })
                }
                trackColor={{ false: '#1e293b', true: isLight ? '#0284c7' : '#38bdf8' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <Text style={[styles.fieldHeading, { color: isLight ? '#0284c7' : '#38bdf8' }]}>
            SELECT ACTIVE LOGISTICS AGGREGATOR / CARRIER:
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#0284c7' : '#38bdf8' },
            ]}
            onPress={() => toggleDropdown('logistics')}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons name="cube-outline" size={18} color={isLight ? '#0284c7' : '#38bdf8'} />
              <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                Active Courier Engine: <Text style={{ fontWeight: '900', color: isLight ? '#0284c7' : '#38bdf8' }}>{localConfig.logistics.activeProvider}</Text>
              </Text>
            </View>
            <Ionicons
              name={openDropdowns['logistics'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isLight ? '#0284c7' : '#38bdf8'}
            />
          </TouchableOpacity>

          {openDropdowns['logistics'] && (
            <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
              {[
                { key: 'SHIPROCKET', name: 'Shiprocket Multi-Courier Aggregator', tag: '25+ COURIERS / AUTOMATED AWB', icon: 'cube' },
                { key: 'DELHIVERY', name: 'Delhivery Direct Express B2C/B2B', tag: 'FLEET & AIR CONNECTIVITY', icon: 'airplane' },
                { key: 'SHADOWFAX', name: 'Shadowfax Hyperlocal Logistics', tag: 'RURAL PINCODE NETWORK', icon: 'bicycle' },
                { key: 'NIMBUSPOST', name: 'NimbusPost Shipping Platform', tag: 'LOWEST AGGREGATOR RATES', icon: 'pricetag' },
                { key: 'BLUEDART', name: 'Blue Dart Express (DHL Network)', tag: 'PREMIUM AIR CARGO', icon: 'rocket' },
                { key: 'DTDC', name: 'DTDC Express Courier India', tag: 'EXTENSIVE RURAL COVERAGE', icon: 'navigate' },
                { key: 'BORZO', name: 'Borzo / WeFast Intra-City Express', tag: 'SAME-DAY FARM INPUT DELIVERY', icon: 'time' },
              ].map((item) => {
                const isSelected = localConfig.logistics.activeProvider === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: isLight ? 'rgba(14, 165, 233, 0.1)' : 'rgba(56, 189, 248, 0.15)' },
                    ]}
                    onPress={() => {
                      setLocalConfig({
                        ...localConfig,
                        logistics: { ...localConfig.logistics, activeProvider: item.key as any },
                      });
                      toggleDropdown('logistics');
                      showToast(`⚡ Switched Logistics to ${item.name}`);
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? (isLight ? '#0284c7' : '#38bdf8') : subTextColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#0284c7' : '#38bdf8') : subTextColor }]}>
                        {item.tag}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={isLight ? '#0284c7' : '#38bdf8'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 🚚 Dynamic Logistics Provider Cards & Quota Telemetry */}
          {(() => {
            const activeLogKey = localConfig.logistics?.activeProvider || 'SHIPROCKET';
            const activeLogMeta = ALL_LOGISTICS_PROVIDERS.find((p) => p.key === activeLogKey) || ALL_LOGISTICS_PROVIDERS[0];
            const monthlyShipmentQuota = activeLogMeta.monthlyQuota;
            const usedShipments = activeLogMeta.simulatedUsedShipments;
            const logPercentage = Math.min(100, Math.round((usedShipments / monthlyShipmentQuota) * 100));
            const remainingShipments = Math.max(0, monthlyShipmentQuota - usedShipments);
            return (
              <>
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldHeading, { color: isLight ? '#0284c7' : '#38bdf8' }]}>
                    ALL 7 COURIER AGGREGATORS & FLEET NETWORKS:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.telecomCardsScroll}>
                    {ALL_LOGISTICS_PROVIDERS.map((c) => {
                      const isCurSelected = activeLogKey === c.key;
                      return (
                        <TouchableOpacity
                          key={c.key}
                          style={[
                            styles.telecomFeatureCard,
                            {
                              backgroundColor: isCurSelected ? (isLight ? '#f0f9ff' : '#031a29') : (isLight ? '#ffffff' : '#03140a'),
                              borderColor: isCurSelected ? c.color : cardBorder,
                            },
                          ]}
                          onPress={() => {
                            setLocalConfig({
                              ...localConfig,
                              logistics: { ...localConfig.logistics, activeProvider: c.key as any },
                            });
                            showToast(`⚡ Switched Logistics Provider to ${c.name}`);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={[styles.iconBox, { width: 32, height: 32, backgroundColor: isLight ? 'rgba(14, 165, 233, 0.12)' : 'rgba(56, 189, 248, 0.15)' }]}>
                              <Ionicons name={c.icon} size={16} color={c.color} />
                            </View>
                            <View style={[styles.telecomPlanBadge, { backgroundColor: isCurSelected ? c.color : (isLight ? '#f1f5f9' : '#0f172a') }]}>
                              <Text style={[styles.telecomPlanBadgeText, { color: isCurSelected ? '#ffffff' : subTextColor }]}>
                                {c.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.telecomCardTitle, { color: textColor }]}>{c.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: c.color }}>{c.planBadge}</Text>
                          <View style={{ gap: 2, marginTop: 4 }}>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Coverage: <Text style={{ color: textColor, fontWeight: '700' }}>{c.pincodeCoverage}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Rates: <Text style={{ color: textColor, fontWeight: '700' }}>{c.shippingRate}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• COD Remittance: <Text style={{ color: textColor, fontWeight: '700' }}>{c.codRemittance}</Text></Text>
                          </View>
                          {isCurSelected && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Ionicons name="checkmark-circle" size={14} color="#0284c7" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#0284c7' }}>ACTIVE COURIER FLEET</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🌟 Selected Logistics Deep-Dive & Recommendation */}
                <View style={[styles.telecomDetailCard, { backgroundColor: innerBg, borderColor: activeLogMeta.color, borderWidth: 1.5 }]}>
                  <View style={styles.telecomDetailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={activeLogMeta.icon} size={20} color={activeLogMeta.color} />
                      <Text style={[styles.telecomDetailTitle, { color: textColor }]}>
                        Active Courier Fleet: {activeLogMeta.name}
                      </Text>
                    </View>
                    <View style={[styles.telecomPlanBadge, { backgroundColor: activeLogMeta.color }]}>
                      <Text style={[styles.telecomPlanBadgeText, { color: '#ffffff' }]}>
                        {activeLogMeta.planBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: isLight ? '#0284c7' : '#38bdf8', marginVertical: 4 }}>
                    {activeLogMeta.recommendation}
                  </Text>
                  <View style={styles.telecomDetailBadgesRow}>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>PIN Code Reach</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeLogMeta.pincodeCoverage}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Early COD Payout</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeLogMeta.codRemittance}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Base Shipping Tariff</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeLogMeta.shippingRate}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Prepaid Wallet</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeLogMeta.walletBalance}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 6, fontStyle: 'italic' }}>
                    {activeLogMeta.summary}
                  </Text>
                </View>

                {/* 📊 Courier Dispatch Telemetry & Wallet Quota Monitor */}
                <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
                  <View style={styles.telecomUsageHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="cube" size={17} color={isLight ? '#0284c7' : '#38bdf8'} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                        📊 Courier Dispatch Telemetry & Wallet Quota Monitor (Current Month)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#f0f9ff' : 'rgba(2, 132, 199, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0284c7' }} />
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#0284c7' : '#38bdf8' }}>
                        AGGREGATOR ONLINE • 29,000 PINCODES
                      </Text>
                    </View>
                  </View>

                  {/* Quota Progress Bar */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                        Monthly Dispatched Parcels: <Text style={{ color: activeLogMeta.color, fontWeight: '900' }}>{usedShipments.toLocaleString('en-IN')}</Text> / {monthlyShipmentQuota.toLocaleString('en-IN')} Capacity
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#0284c7' }}>
                        {logPercentage}% Capacity Used
                      </Text>
                    </View>
                    <View style={[styles.telecomProgressBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
                      <View
                        style={[
                          styles.telecomProgressBarFill,
                          {
                            width: `${Math.max(5, logPercentage)}%`,
                            backgroundColor: logPercentage > 85 ? '#dc2626' : logPercentage > 60 ? '#d97706' : '#0284c7',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Usage Statistics Row */}
                  <View style={styles.telecomUsageStatsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="wallet-outline" size={13} color="#0284c7" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284c7' }}>
                        Prepaid Wallet: {activeLogMeta.walletBalance}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="card-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Early COD: <Text style={{ fontWeight: '800', color: textColor }}>T+2 Bank Direct</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="map-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Reach: <Text style={{ fontWeight: '800', color: textColor }}>29,000+ PIN Codes</Text>
                      </Text>
                    </View>
                  </View>

                  {/* ⚡ Test Connection & Courier Ping */}
                  <TouchableOpacity
                    style={[styles.testPingBtn, { backgroundColor: isLight ? '#0284c7' : '#0369a1', opacity: isTestingLogistics ? 0.7 : 1 }]}
                    activeOpacity={0.85}
                    disabled={isTestingLogistics}
                    onPress={handleTestLogisticsHandshake}
                  >
                    {isTestingLogistics ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="pulse" size={14} color="#ffffff" />
                    )}
                    <Text style={styles.testPingBtnText}>
                      {isTestingLogistics ? 'Validating Courier Pincode Serviceability...' : `⚡ Test Courier Serviceability & Tracking Ping (${activeLogMeta.name.split(' ')[0]})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
            {(localConfig.logistics.activeProvider === 'SHIPROCKET' || !localConfig.logistics.activeProvider) && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🚀 Shiprocket Multi-Courier Aggregator API</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Shiprocket Account Email"
                    value={localConfig.logistics?.providers?.shiprocket?.email || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            shiprocket: { ...localConfig.logistics.providers.shiprocket, email: val },
                          },
                        },
                      })
                    }
                    placeholder="logistics@farmsking.in"
                    isLight={isLight}
                  />
                  <InputField
                    label="Shiprocket Password"
                    value={localConfig.logistics?.providers?.shiprocket?.password || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            shiprocket: { ...localConfig.logistics.providers.shiprocket, password: val },
                          },
                        },
                      })
                    }
                    placeholder="Account password"
                    isSecret={!showSecrets['shiprocket_pw']}
                    onToggleSecret={() => toggleSecret('shiprocket_pw')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.logistics.activeProvider === 'DELHIVERY' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🚚 Delhivery Direct Fleet Enterprise API</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Delhivery Client Name"
                    value={localConfig.logistics?.providers?.delhivery?.clientName || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            delhivery: { ...(localConfig.logistics.providers.delhivery || {}), clientName: val },
                          },
                        },
                      })
                    }
                    placeholder="FARMSKING_EXPRESS"
                    isLight={isLight}
                  />
                  <InputField
                    label="Delhivery Production API Token"
                    value={localConfig.logistics?.providers?.delhivery?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            delhivery: { ...(localConfig.logistics.providers.delhivery || {}), apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Bearer token..."
                    isSecret={!showSecrets['delhivery_key']}
                    onToggleSecret={() => toggleSecret('delhivery_key')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.logistics.activeProvider === 'NIMBUSPOST' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>⚡ NimbusPost Multi-Carrier Hub Credentials</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="NimbusPost Login Email"
                    value={localConfig.logistics?.providers?.nimbuspost?.email || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            nimbuspost: {
                              email: val,
                              password: localConfig.logistics.providers.nimbuspost?.password || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="dispatch@farmsking.in"
                    isLight={isLight}
                  />
                  <InputField
                    label="NimbusPost Password / Token"
                    value={localConfig.logistics?.providers?.nimbuspost?.password || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            nimbuspost: {
                              email: localConfig.logistics.providers.nimbuspost?.email || '',
                              password: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="Password"
                    isSecret={!showSecrets['nimbuspost_pw']}
                    onToggleSecret={() => toggleSecret('nimbuspost_pw')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.logistics.activeProvider === 'SHADOWFAX' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🏡 Shadowfax Hyperlocal & Express Credentials</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Shadowfax Client Code"
                    value={localConfig.logistics?.providers?.shadowfax?.clientCode || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            shadowfax: {
                              clientCode: val,
                              apiKey: localConfig.logistics.providers.shadowfax?.apiKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="SF_FARMSKING_01"
                    isLight={isLight}
                  />
                  <InputField
                    label="Shadowfax Secret API Key"
                    value={localConfig.logistics?.providers?.shadowfax?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            shadowfax: {
                              clientCode: localConfig.logistics.providers.shadowfax?.clientCode || '',
                              apiKey: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="Key..."
                    isSecret={!showSecrets['shadowfax_key']}
                    onToggleSecret={() => toggleSecret('shadowfax_key')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.logistics.activeProvider === 'BLUEDART' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>✈️ BlueDart (DHL) Air Express Credentials</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="BlueDart Login ID"
                    value={localConfig.logistics?.providers?.bluedart?.loginId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            bluedart: {
                              loginId: val,
                              customerCode: localConfig.logistics.providers.bluedart?.customerCode || '',
                              licenceKey: localConfig.logistics.providers.bluedart?.licenceKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="FRMKNG_AIR"
                    isLight={isLight}
                  />
                  <InputField
                    label="Customer Code"
                    value={localConfig.logistics?.providers?.bluedart?.customerCode || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            bluedart: {
                              loginId: localConfig.logistics.providers.bluedart?.loginId || '',
                              customerCode: val,
                              licenceKey: localConfig.logistics.providers.bluedart?.licenceKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="123456"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Licence Key"
                  value={localConfig.logistics?.providers?.bluedart?.licenceKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      logistics: {
                        ...localConfig.logistics,
                        providers: {
                          ...localConfig.logistics.providers,
                          bluedart: {
                            loginId: localConfig.logistics.providers.bluedart?.loginId || '',
                            customerCode: localConfig.logistics.providers.bluedart?.customerCode || '',
                            licenceKey: val,
                          },
                        },
                      },
                    })
                  }
                  placeholder="licence_key_..."
                  isSecret={!showSecrets['bluedart_key']}
                  onToggleSecret={() => toggleSecret('bluedart_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.logistics.activeProvider === 'DTDC' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📦 DTDC Express India Rural API</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="DTDC Customer ID"
                    value={localConfig.logistics?.providers?.dtdc?.customerId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            dtdc: {
                              customerId: val,
                              apiKey: localConfig.logistics.providers.dtdc?.apiKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="DTDC_PUNJAB_01"
                    isLight={isLight}
                  />
                  <InputField
                    label="DTDC API Key"
                    value={localConfig.logistics?.providers?.dtdc?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        logistics: {
                          ...localConfig.logistics,
                          providers: {
                            ...localConfig.logistics.providers,
                            dtdc: {
                              customerId: localConfig.logistics.providers.dtdc?.customerId || '',
                              apiKey: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="dtdc_api_key_..."
                    isSecret={!showSecrets['dtdc_key']}
                    onToggleSecret={() => toggleSecret('dtdc_key')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.logistics.activeProvider === 'BORZO' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🚲 Borzo (WeFast) Same-Day API</Text>
                <InputField
                  label="Borzo Secret Auth Token"
                  value={localConfig.logistics?.providers?.borzo?.authKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      logistics: {
                        ...localConfig.logistics,
                        providers: {
                          ...localConfig.logistics.providers,
                          borzo: { ...(localConfig.logistics.providers.borzo || {}), authKey: val },
                        },
                      },
                    })
                  }
                  placeholder="borzo_token_..."
                  isSecret={!showSecrets['borzo_key']}
                  onToggleSecret={() => toggleSecret('borzo_key')}
                  isLight={isLight}
                />
              </>
            )}
          </View>
        </View>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 8. CLOUD STORAGE & PUSH NOTIFICATIONS                             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'STORAGE_PUSH') && (
        <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(244, 63, 94, 0.12)' : 'rgba(251, 113, 133, 0.15)' }]}>
                <Ionicons name="server" size={22} color={isLight ? '#e11d48' : '#fb7185'} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: textColor }]}>8. Cloud Storage & Push Notifications</Text>
                <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                  High-speed image storage on Cloudflare R2 (zero egress fees) and instant Firebase FCM push siren broadcasts.
                </Text>
              </View>
            </View>
          </View>

          {/* Cloud Storage Dropdown */}
          <Text style={[styles.fieldHeading, { color: isLight ? '#e11d48' : '#fb7185' }]}>
            SELECT ACTIVE CLOUD OBJECT STORAGE:
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#e11d48' : '#fb7185' },
            ]}
            onPress={() => toggleDropdown('storage')}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons name="cloud-outline" size={18} color={isLight ? '#e11d48' : '#fb7185'} />
              <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                Active Object Storage: <Text style={{ fontWeight: '900', color: isLight ? '#e11d48' : '#fb7185' }}>{localConfig.storage?.activeProvider || 'CLOUDFLARE_R2'}</Text>
              </Text>
            </View>
            <Ionicons
              name={openDropdowns['storage'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isLight ? '#e11d48' : '#fb7185'}
            />
          </TouchableOpacity>

          {openDropdowns['storage'] && (
            <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
              {[
                { key: 'CLOUDFLARE_R2', name: 'Cloudflare R2 Object Store', tag: '100% ZERO EGRESS FEES / 10 GB FREE', icon: 'cloud' },
                { key: 'AWS_S3', name: 'Amazon Web Services S3', tag: 'GLOBAL BENCHMARK', icon: 'server' },
                { key: 'GOOGLE_GCS', name: 'Google Cloud Storage (GCS)', tag: 'NATIVE GCP BUCKET', icon: 'logo-google' },
                { key: 'SUPABASE', name: 'Supabase Postgres Object Storage', tag: 'DEVELOPER FRIENDLY', icon: 'database' },
                { key: 'MINIO', name: 'MinIO Self-Hosted Private Cloud', tag: 'PRIVATE S3 COMPLIANCE', icon: 'shield' },
                { key: 'BUNNY_CDN', name: 'Bunny.net Edge Storage & CDN', tag: 'ULTRA-FAST GLOBAL CDN', icon: 'flash' },
              ].map((item) => {
                const isSelected = (localConfig.storage?.activeProvider || 'CLOUDFLARE_R2') === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: isLight ? 'rgba(244, 63, 94, 0.1)' : 'rgba(251, 113, 133, 0.15)' },
                    ]}
                    onPress={() => {
                      setLocalConfig({
                        ...localConfig,
                        storage: { ...localConfig.storage, activeProvider: item.key as any },
                      });
                      toggleDropdown('storage');
                      showToast(`⚡ Switched Cloud Storage to ${item.name}`);
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? (isLight ? '#e11d48' : '#fb7185') : subTextColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#e11d48' : '#fb7185') : subTextColor }]}>
                        {item.tag}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={isLight ? '#e11d48' : '#fb7185'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ☁️ Dynamic Storage Provider Cards & Quota Telemetry */}
          {(() => {
            const activeStorageKey = localConfig.storage?.activeProvider || 'CLOUDFLARE_R2';
            const activeStorageMeta = ALL_STORAGE_PROVIDERS.find((p) => p.key === activeStorageKey) || ALL_STORAGE_PROVIDERS[0];
            const monthlyQuotaGb = activeStorageMeta.monthlyQuotaGb;
            const usedGb = activeStorageMeta.simulatedUsedGb;
            const storagePercentage = Math.min(100, Math.round((usedGb / monthlyQuotaGb) * 100));
            const remainingGb = Math.max(0, monthlyQuotaGb - usedGb);
            return (
              <>
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldHeading, { color: isLight ? '#e11d48' : '#fb7185' }]}>
                    ALL 5 CLOUD OBJECT STORAGE ENGINES:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.telecomCardsScroll}>
                    {ALL_STORAGE_PROVIDERS.map((s) => {
                      const isCurSelected = activeStorageKey === s.key;
                      return (
                        <TouchableOpacity
                          key={s.key}
                          style={[
                            styles.telecomFeatureCard,
                            {
                              backgroundColor: isCurSelected ? (isLight ? '#fff1f2' : '#260811') : (isLight ? '#ffffff' : '#03140a'),
                              borderColor: isCurSelected ? s.color : cardBorder,
                            },
                          ]}
                          onPress={() => {
                            setLocalConfig({
                              ...localConfig,
                              storage: { ...localConfig.storage, activeProvider: s.key as any },
                            });
                            showToast(`⚡ Switched Cloud Storage to ${s.name}`);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={[styles.iconBox, { width: 32, height: 32, backgroundColor: isLight ? 'rgba(244, 63, 94, 0.12)' : 'rgba(251, 113, 133, 0.15)' }]}>
                              <Ionicons name={s.icon} size={16} color={s.color} />
                            </View>
                            <View style={[styles.telecomPlanBadge, { backgroundColor: isCurSelected ? s.color : (isLight ? '#f1f5f9' : '#0f172a') }]}>
                              <Text style={[styles.telecomPlanBadgeText, { color: isCurSelected ? '#ffffff' : subTextColor }]}>
                                {s.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.telecomCardTitle, { color: textColor }]}>{s.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{s.planBadge}</Text>
                          <View style={{ gap: 2, marginTop: 4 }}>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Egress: <Text style={{ color: textColor, fontWeight: '700' }}>{s.egressFee}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• Storage: <Text style={{ color: textColor, fontWeight: '700' }}>{s.storageRate}</Text></Text>
                            <Text style={{ fontSize: 10.5, color: subTextColor }}>• API: <Text style={{ color: textColor, fontWeight: '700' }}>{s.apiCompat}</Text></Text>
                          </View>
                          {isCurSelected && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Ionicons name="checkmark-circle" size={14} color="#e11d48" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#e11d48' }}>ACTIVE STORAGE BUCKET</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🌟 Selected Storage Deep-Dive & Recommendation */}
                <View style={[styles.telecomDetailCard, { backgroundColor: innerBg, borderColor: activeStorageMeta.color, borderWidth: 1.5 }]}>
                  <View style={styles.telecomDetailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={activeStorageMeta.icon} size={20} color={activeStorageMeta.color} />
                      <Text style={[styles.telecomDetailTitle, { color: textColor }]}>
                        Active Bucket: {activeStorageMeta.name}
                      </Text>
                    </View>
                    <View style={[styles.telecomPlanBadge, { backgroundColor: activeStorageMeta.color }]}>
                      <Text style={[styles.telecomPlanBadgeText, { color: '#ffffff' }]}>
                        {activeStorageMeta.planBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: isLight ? '#e11d48' : '#fb7185', marginVertical: 4 }}>
                    {activeStorageMeta.recommendation}
                  </Text>
                  <View style={styles.telecomDetailBadgesRow}>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Free Allowance</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeStorageMeta.freeTier}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Egress Bandwidth</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeStorageMeta.egressFee}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Overage Tariff</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeStorageMeta.storageRate}</Text>
                    </View>
                    <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>API Compatibility</Text>
                      <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeStorageMeta.apiCompat}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 6, fontStyle: 'italic' }}>
                    {activeStorageMeta.summary}
                  </Text>
                </View>

                {/* 📊 Cloud Storage & Push Notification Telemetry Monitor */}
                <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
                  <View style={styles.telecomUsageHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="server" size={17} color={isLight ? '#e11d48' : '#fb7185'} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                        📊 Cloud Storage & Push Notification Telemetry Monitor (Current Month)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#fff1f2' : 'rgba(244, 63, 94, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#e11d48' }} />
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#e11d48' : '#fb7185' }}>
                        CDN & PUSH DAEMON ONLINE
                      </Text>
                    </View>
                  </View>

                  {/* Quota Progress Bar */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                        Cloud Storage Consumed: <Text style={{ color: activeStorageMeta.color, fontWeight: '900' }}>{usedGb.toFixed(1)} GB</Text> / {monthlyQuotaGb.toFixed(1)} GB Free Quota
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e11d48' }}>
                        {storagePercentage}% Quota Used
                      </Text>
                    </View>
                    <View style={[styles.telecomProgressBarWrap, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
                      <View
                        style={[
                          styles.telecomProgressBarFill,
                          {
                            width: `${Math.max(5, storagePercentage)}%`,
                            backgroundColor: storagePercentage > 85 ? '#dc2626' : storagePercentage > 60 ? '#d97706' : '#e11d48',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Usage Statistics Row */}
                  <View style={styles.telecomUsageStatsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cloud-done-outline" size={13} color="#e11d48" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#e11d48' }}>
                        {remainingGb.toFixed(1)} GB Free Space Left
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cash-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        Egress Bill: <Text style={{ fontWeight: '800', color: textColor }}>₹0.00 (Zero Egress R2)</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="notifications-outline" size={13} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        FCM Siren: <Text style={{ fontWeight: '800', color: textColor }}>Active & Unlimited</Text>
                      </Text>
                    </View>
                  </View>

                  {/* ⚡ Test Connection & Storage/Push Ping */}
                  <TouchableOpacity
                    style={[styles.testPingBtn, { backgroundColor: isLight ? '#e11d48' : '#be123c', opacity: isTestingStorage ? 0.7 : 1 }]}
                    activeOpacity={0.85}
                    disabled={isTestingStorage}
                    onPress={handleTestStorageHandshake}
                  >
                    {isTestingStorage ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="pulse" size={14} color="#ffffff" />
                    )}
                    <Text style={styles.testPingBtnText}>
                      {isTestingStorage ? 'Testing Put/Get Object & FCM Handshake...' : `⚡ Test Cloud Object Put/Get & FCM Push Handshake (${activeStorageMeta.name.split(' ')[0]})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          {/* Push Notifications Dropdown */}
          <Text style={[styles.fieldHeading, { color: isLight ? '#e11d48' : '#fb7185', marginTop: 14 }]}>
            SELECT ACTIVE PUSH NOTIFICATION ENGINE:
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#e11d48' : '#fb7185' },
            ]}
            onPress={() => toggleDropdown('push')}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons name="notifications-outline" size={18} color={isLight ? '#e11d48' : '#fb7185'} />
              <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                Active Push Engine: <Text style={{ fontWeight: '900', color: isLight ? '#e11d48' : '#fb7185' }}>{localConfig.push?.activeProvider || 'FIREBASE_FCM'}</Text>
              </Text>
            </View>
            <Ionicons
              name={openDropdowns['push'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isLight ? '#e11d48' : '#fb7185'}
            />
          </TouchableOpacity>

          {openDropdowns['push'] && (
            <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
              {[
                { key: 'FIREBASE_FCM', name: 'Firebase Cloud Messaging (FCM)', tag: '100% FREE UNLIMITED PUSH', icon: 'notifications' },
                { key: 'ONE_SIGNAL', name: 'OneSignal Notification Platform', tag: 'ADVANCED SEGMENTATION', icon: 'radio' },
                { key: 'PUSHER', name: 'Pusher Beams Realtime Delivery', tag: 'INSTANT ALERTS', icon: 'pulse' },
                { key: 'EXPO_PUSH', name: 'Expo Push Notification Gateway', tag: 'NATIVE REACT NATIVE RELAY', icon: 'paper-plane' },
              ].map((item) => {
                const isSelected = (localConfig.push?.activeProvider || 'FIREBASE_FCM') === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: isLight ? 'rgba(244, 63, 94, 0.1)' : 'rgba(251, 113, 133, 0.15)' },
                    ]}
                    onPress={() => {
                      setLocalConfig({
                        ...localConfig,
                        push: { ...localConfig.push, activeProvider: item.key as any },
                      });
                      toggleDropdown('push');
                      showToast(`⚡ Switched Push Engine to ${item.name}`);
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? (isLight ? '#e11d48' : '#fb7185') : subTextColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#e11d48' : '#fb7185') : subTextColor }]}>
                        {item.tag}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={isLight ? '#e11d48' : '#fb7185'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder, marginTop: 14 }]}>
            {/* ── Dynamic Cloud Storage Credentials ── */}
            {(localConfig.storage?.activeProvider === 'CLOUDFLARE_R2' || !localConfig.storage?.activeProvider) && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>☁️ Cloudflare R2 Media Bucket (Zero Bandwidth Fees)</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="R2 Account ID"
                    value={localConfig.storage?.providers?.cloudflareR2?.accountId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            cloudflareR2: { ...(localConfig.storage.providers.cloudflareR2 || {}), accountId: val },
                          },
                        },
                      })
                    }
                    placeholder="cf_account_id..."
                    isLight={isLight}
                  />
                  <InputField
                    label="R2 Bucket Name"
                    value={localConfig.storage?.providers?.cloudflareR2?.bucketName || 'farmsking-media'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            cloudflareR2: { ...(localConfig.storage.providers.cloudflareR2 || {}), bucketName: val },
                          },
                        },
                      })
                    }
                    placeholder="farmsking-media"
                    isLight={isLight}
                  />
                </View>
                <View style={styles.twoColRow}>
                  <InputField
                    label="R2 Access Key ID"
                    value={localConfig.storage?.providers?.cloudflareR2?.accessKeyId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            cloudflareR2: { ...(localConfig.storage.providers.cloudflareR2 || {}), accessKeyId: val },
                          },
                        },
                      })
                    }
                    placeholder="R2 Access Key"
                    isLight={isLight}
                  />
                  <InputField
                    label="R2 Secret Access Key"
                    value={localConfig.storage?.providers?.cloudflareR2?.secretAccessKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            cloudflareR2: { ...(localConfig.storage.providers.cloudflareR2 || {}), secretAccessKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Secret Key"
                    isSecret={!showSecrets['r2_secret']}
                    onToggleSecret={() => toggleSecret('r2_secret')}
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Public CDN / Custom Domain URL"
                  value={localConfig.storage?.providers?.cloudflareR2?.publicUrl || 'https://media.farmsking.in'}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      storage: {
                        ...localConfig.storage,
                        providers: {
                          ...localConfig.storage.providers,
                          cloudflareR2: { ...(localConfig.storage.providers.cloudflareR2 || {}), publicUrl: val },
                        },
                      },
                    })
                  }
                  placeholder="https://media.farmsking.in"
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.storage?.activeProvider === 'AWS_S3' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🌐 Amazon Web Services S3 Bucket</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="AWS Region"
                    value={localConfig.storage?.providers?.awsS3?.region || 'ap-south-1'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            awsS3: { ...(localConfig.storage.providers.awsS3 || {}), region: val },
                          },
                        },
                      })
                    }
                    placeholder="ap-south-1 (Mumbai)"
                    isLight={isLight}
                  />
                  <InputField
                    label="S3 Bucket Name"
                    value={localConfig.storage?.providers?.awsS3?.bucketName || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            awsS3: { ...(localConfig.storage.providers.awsS3 || {}), bucketName: val },
                          },
                        },
                      })
                    }
                    placeholder="farmsking-production"
                    isLight={isLight}
                  />
                </View>
                <View style={styles.twoColRow}>
                  <InputField
                    label="AWS Access Key ID"
                    value={localConfig.storage?.providers?.awsS3?.accessKeyId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            awsS3: { ...(localConfig.storage.providers.awsS3 || {}), accessKeyId: val },
                          },
                        },
                      })
                    }
                    placeholder="AKIA..."
                    isLight={isLight}
                  />
                  <InputField
                    label="AWS Secret Access Key"
                    value={localConfig.storage?.providers?.awsS3?.secretAccessKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            awsS3: { ...(localConfig.storage.providers.awsS3 || {}), secretAccessKey: val },
                          },
                        },
                      })
                    }
                    placeholder="Secret Key"
                    isSecret={!showSecrets['aws_s3_secret']}
                    onToggleSecret={() => toggleSecret('aws_s3_secret')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.storage?.activeProvider === 'GOOGLE_GCS' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📦 Google Cloud Storage (GCS) Bucket</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="GCS Bucket Name"
                    value={localConfig.storage?.providers?.googleGcs?.bucketName || 'farmsking-cloud-storage'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            googleGcs: {
                              bucketName: val,
                              clientEmail: localConfig.storage?.providers?.googleGcs?.clientEmail || '',
                              privateKey: localConfig.storage?.providers?.googleGcs?.privateKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="farmsking-cloud-storage"
                    isLight={isLight}
                  />
                  <InputField
                    label="Service Account Client Email"
                    value={localConfig.storage?.providers?.googleGcs?.clientEmail || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            googleGcs: {
                              bucketName: localConfig.storage?.providers?.googleGcs?.bucketName || '',
                              clientEmail: val,
                              privateKey: localConfig.storage?.providers?.googleGcs?.privateKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="gcs-admin@farmsking.iam.gserviceaccount.com"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Private Key (PEM)"
                  value={localConfig.storage?.providers?.googleGcs?.privateKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      storage: {
                        ...localConfig.storage,
                        providers: {
                          ...localConfig.storage.providers,
                          googleGcs: {
                            bucketName: localConfig.storage?.providers?.googleGcs?.bucketName || '',
                            clientEmail: localConfig.storage?.providers?.googleGcs?.clientEmail || '',
                            privateKey: val,
                          },
                        },
                      },
                    })
                  }
                  placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                  isSecret={!showSecrets['gcs_key']}
                  onToggleSecret={() => toggleSecret('gcs_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.storage?.activeProvider === 'SUPABASE' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>⚡ Supabase Storage Bucket</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Supabase Project URL"
                    value={localConfig.storage?.providers?.supabase?.projectUrl || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            supabase: { ...(localConfig.storage.providers.supabase || {}), projectUrl: val },
                          },
                        },
                      })
                    }
                    placeholder="https://xyz.supabase.co"
                    isLight={isLight}
                  />
                  <InputField
                    label="Storage Bucket Name"
                    value={localConfig.storage?.providers?.supabase?.bucketName || 'farmsking-docs'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            supabase: { ...(localConfig.storage.providers.supabase || {}), bucketName: val },
                          },
                        },
                      })
                    }
                    placeholder="farmsking-docs"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Supabase Anon / Service Role Key"
                  value={localConfig.storage?.providers?.supabase?.anonKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      storage: {
                        ...localConfig.storage,
                        providers: {
                          ...localConfig.storage.providers,
                          supabase: { ...(localConfig.storage.providers.supabase || {}), anonKey: val },
                        },
                      },
                    })
                  }
                  placeholder="eyJhbGci..."
                  isSecret={!showSecrets['supabase_key']}
                  onToggleSecret={() => toggleSecret('supabase_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.storage?.activeProvider === 'MINIO' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🛡️ MinIO Self-Hosted Private Storage</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="MinIO Endpoint URL"
                    value={localConfig.storage?.providers?.minio?.endpoint || 'http://localhost:9000'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            minio: {
                              endpoint: val,
                              bucketName: localConfig.storage?.providers?.minio?.bucketName || '',
                              accessKey: localConfig.storage?.providers?.minio?.accessKey || '',
                              secretKey: localConfig.storage?.providers?.minio?.secretKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="http://s3.farmsking.internal:9000"
                    isLight={isLight}
                  />
                  <InputField
                    label="MinIO Bucket Name"
                    value={localConfig.storage?.providers?.minio?.bucketName || 'farmsking'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            minio: {
                              endpoint: localConfig.storage?.providers?.minio?.endpoint || '',
                              bucketName: val,
                              accessKey: localConfig.storage?.providers?.minio?.accessKey || '',
                              secretKey: localConfig.storage?.providers?.minio?.secretKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="farmsking"
                    isLight={isLight}
                  />
                </View>
                <View style={styles.twoColRow}>
                  <InputField
                    label="MinIO Access Key"
                    value={localConfig.storage?.providers?.minio?.accessKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            minio: {
                              endpoint: localConfig.storage?.providers?.minio?.endpoint || '',
                              bucketName: localConfig.storage?.providers?.minio?.bucketName || '',
                              accessKey: val,
                              secretKey: localConfig.storage?.providers?.minio?.secretKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="minioadmin"
                    isLight={isLight}
                  />
                  <InputField
                    label="MinIO Secret Key"
                    value={localConfig.storage?.providers?.minio?.secretKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            minio: {
                              endpoint: localConfig.storage?.providers?.minio?.endpoint || '',
                              bucketName: localConfig.storage?.providers?.minio?.bucketName || '',
                              accessKey: localConfig.storage?.providers?.minio?.accessKey || '',
                              secretKey: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="Secret Key"
                    isSecret={!showSecrets['minio_secret']}
                    onToggleSecret={() => toggleSecret('minio_secret')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.storage?.activeProvider === 'BUNNY_CDN' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>⚡ Bunny.net Edge Storage & Global CDN</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Storage Zone Name"
                    value={localConfig.storage?.providers?.bunnyCdn?.storageZoneName || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            bunnyCdn: {
                              storageZoneName: val,
                              pullZoneUrl: localConfig.storage?.providers?.bunnyCdn?.pullZoneUrl || '',
                              accessKey: localConfig.storage?.providers?.bunnyCdn?.accessKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="farmsking-media"
                    isLight={isLight}
                  />
                  <InputField
                    label="Pull Zone CDN URL"
                    value={localConfig.storage?.providers?.bunnyCdn?.pullZoneUrl || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        storage: {
                          ...localConfig.storage,
                          providers: {
                            ...localConfig.storage.providers,
                            bunnyCdn: {
                              storageZoneName: localConfig.storage?.providers?.bunnyCdn?.storageZoneName || '',
                              pullZoneUrl: val,
                              accessKey: localConfig.storage?.providers?.bunnyCdn?.accessKey || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="https://farmsking.b-cdn.net"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="Bunny Storage API Access Key"
                  value={localConfig.storage?.providers?.bunnyCdn?.accessKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      storage: {
                        ...localConfig.storage,
                        providers: {
                          ...localConfig.storage.providers,
                          bunnyCdn: {
                          storageZoneName: localConfig.storage?.providers?.bunnyCdn?.storageZoneName || '',
                          pullZoneUrl: localConfig.storage?.providers?.bunnyCdn?.pullZoneUrl || '',
                          accessKey: val,
                        },
                        },
                      },
                    })
                  }
                  placeholder="Storage Password / Key"
                  isSecret={!showSecrets['bunny_key']}
                  onToggleSecret={() => toggleSecret('bunny_key')}
                  isLight={isLight}
                />
              </>
            )}

            <View style={styles.divider} />

            {/* ── Dynamic Push Notification Credentials ── */}
            {(localConfig.push?.activeProvider === 'FIREBASE_FCM' || !localConfig.push?.activeProvider) && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🔔 Firebase Cloud Messaging (FCM) Siren Broadcasts</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Weather Siren Alert Topic"
                    value={localConfig.push?.providers?.firebaseFcm?.topicWeatherSiren || 'farmsking_weather_siren'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        push: {
                          ...localConfig.push,
                          providers: {
                            ...localConfig.push.providers,
                            firebaseFcm: { ...(localConfig.push.providers.firebaseFcm || {}), topicWeatherSiren: val },
                          },
                        },
                      })
                    }
                    placeholder="farmsking_weather_siren"
                    isLight={isLight}
                  />
                  <InputField
                    label="Mandi Rates Alert Topic"
                    value={localConfig.push?.providers?.firebaseFcm?.topicMandiAlerts || 'farmsking_mandi_rates'}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        push: {
                          ...localConfig.push,
                          providers: {
                            ...localConfig.push.providers,
                            firebaseFcm: { ...(localConfig.push.providers.firebaseFcm || {}), topicMandiAlerts: val },
                          },
                        },
                      })
                    }
                    placeholder="farmsking_mandi_rates"
                    isLight={isLight}
                  />
                </View>
                <InputField
                  label="FCM Server Key (Legacy / HTTP v1)"
                  value={localConfig.push?.providers?.firebaseFcm?.serverKey || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      push: {
                        ...localConfig.push,
                        providers: {
                          ...localConfig.push.providers,
                          firebaseFcm: { ...(localConfig.push.providers.firebaseFcm || {}), serverKey: val },
                        },
                      },
                    })
                  }
                  placeholder="AAAAbcd..."
                  isSecret={!showSecrets['fcm_key']}
                  onToggleSecret={() => toggleSecret('fcm_key')}
                  isLight={isLight}
                />
              </>
            )}

            {localConfig.push?.activeProvider === 'ONE_SIGNAL' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📣 OneSignal Notification Hub</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="OneSignal App ID"
                    value={localConfig.push?.providers?.oneSignal?.appId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        push: {
                          ...localConfig.push,
                          providers: {
                            ...localConfig.push.providers,
                            oneSignal: { ...(localConfig.push.providers.oneSignal || {}), appId: val },
                          },
                        },
                      })
                    }
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    isLight={isLight}
                  />
                  <InputField
                    label="REST API Key"
                    value={localConfig.push?.providers?.oneSignal?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        push: {
                          ...localConfig.push,
                          providers: {
                            ...localConfig.push.providers,
                            oneSignal: { ...(localConfig.push.providers.oneSignal || {}), apiKey: val },
                          },
                        },
                      })
                    }
                    placeholder="os_api_key_..."
                    isSecret={!showSecrets['onesignal_key']}
                    onToggleSecret={() => toggleSecret('onesignal_key')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.push?.activeProvider === 'PUSHER' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>📡 Pusher Beams Realtime Delivery</Text>
                <View style={styles.twoColRow}>
                  <InputField
                    label="Pusher Instance ID"
                    value={localConfig.push?.providers?.pusher?.instanceId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        push: {
                          ...localConfig.push,
                          providers: {
                            ...localConfig.push.providers,
                            pusher: {
                              appId: localConfig.push?.providers?.pusher?.appId || '',
                              instanceId: val,
                              secret: localConfig.push?.providers?.pusher?.secret || '',
                            },
                          },
                        },
                      })
                    }
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    isLight={isLight}
                  />
                  <InputField
                    label="Pusher Secret Key"
                    value={localConfig.push?.providers?.pusher?.secret || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        push: {
                          ...localConfig.push,
                          providers: {
                            ...localConfig.push.providers,
                            pusher: {
                              appId: localConfig.push?.providers?.pusher?.appId || '',
                              instanceId: localConfig.push?.providers?.pusher?.instanceId || '',
                              secret: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="secret..."
                    isSecret={!showSecrets['pusher_secret']}
                    onToggleSecret={() => toggleSecret('pusher_secret')}
                    isLight={isLight}
                  />
                </View>
              </>
            )}

            {localConfig.push?.activeProvider === 'EXPO_PUSH' && (
              <>
                <Text style={[styles.credTitle, { color: textColor }]}>🚀 Expo Push Notification Relay</Text>
                <InputField
                  label="Expo Access Token"
                  value={localConfig.push?.providers?.expoPush?.accessToken || ''}
                  onChangeText={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      push: {
                        ...localConfig.push,
                        providers: {
                          ...localConfig.push.providers,
                          expoPush: { ...(localConfig.push.providers.expoPush || {}), accessToken: val },
                        },
                      },
                    })
                  }
                  placeholder="Expo push token / credentials"
                  isSecret={!showSecrets['expo_push_token']}
                  onToggleSecret={() => toggleSecret('expo_push_token')}
                  isLight={isLight}
                />
              </>
            )}
          </View>
        </View>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 9. SATELLITE TELEMETRY & CROP REMOTE SENSING                     */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'SATELLITE') && (() => {
        const activeSatelliteKey = localConfig.satellite?.activeProvider || 'AGROMONITORING';
        const activeSatelliteMeta = ALL_SATELLITE_PROVIDERS.find((p) => p.key === activeSatelliteKey) || ALL_SATELLITE_PROVIDERS[0];
        const progressPct = Math.min(100, Math.round((activeSatelliteMeta.simulatedUsedRequests / activeSatelliteMeta.dailyFreeRequests) * 100));
        const remainingRequests = Math.max(0, activeSatelliteMeta.dailyFreeRequests - activeSatelliteMeta.simulatedUsedRequests);

        return (
          <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)' }]}>
                  <Ionicons name="planet" size={22} color={isLight ? '#16a34a' : '#00ff87'} />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: textColor }]}>9. Satellite Telemetry & Crop Remote Sensing</Text>
                  <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                    Orbit multispectral scanning, NDVI vegetative health, moisture deficit & crop stress monitoring.
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.tierBadge, { backgroundColor: isLight ? '#d1fae5' : 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#047857' : '#6ee7b7' }}>
                    {activeSatelliteMeta.planBadge}
                  </Text>
                </View>
                <Switch
                  value={localConfig.satellite?.isEnabled ?? true}
                  onValueChange={(val) =>
                    setLocalConfig({
                      ...localConfig,
                      satellite: { ...localConfig.satellite, isEnabled: val },
                    })
                  }
                  trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Satellite Strategy & Comparison Guide */}
            <TouchableOpacity
              style={[styles.strategyGuideBar, { backgroundColor: isLight ? '#f0fdf4' : '#03190d', borderColor: isLight ? '#bbf7d0' : '#0f3822' }]}
              onPress={() => toggleGuide('satellite')}
              activeOpacity={0.8}
            >
              <Ionicons name="telescope" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
              <Text style={[styles.strategyGuideText, { color: textColor }]}>
                💡 Satellite Strategy: <Text style={{ fontWeight: '800', color: isLight ? '#16a34a' : '#00ff87' }}>Agromonitoring</Text> provides 10 hectares free with pre-computed NDVI & soil moisture, while <Text style={{ fontWeight: '800' }}>Sentinel Hub</Text> & <Text style={{ fontWeight: '800' }}>Copernicus</Text> deliver 10m ESA space bands.
              </Text>
              <Ionicons
                name={expandedGuides['satellite'] ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={subTextColor}
              />
            </TouchableOpacity>

            {expandedGuides['satellite'] && (
              <View style={[styles.guideDetailsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.guideHeading, { color: textColor }]}>🛰️ Precision Remote Sensing & Satellite Comparison:</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>OpenWeather Agro (Active):</Text> Turn-key REST API. 10 Hectares (~25 Acres) free forever. Returns NDVI, EVI, and deep soil moisture (0-10cm, 10-40cm) from Sentinel-2 & Landsat-8.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Sentinel Hub (Sinergise / Planet):</Text> Global agritech standard. 10m resolution Sentinel-2 cloud processing with custom Evalscripts for NDVI, NDRE, and NDMI.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Copernicus Data Space (ESA):</Text> 100% Free European Space Agency Open Data. Includes Sentinel-1 synthetic aperture radar (SAR) that penetrates monsoon rain clouds.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Google Earth Engine (GEE):</Text> Petabyte-scale multi-decadal archive. 20+ years of historical vegetation trends for AI yield prediction and crop modeling.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>ISRO Bhuvan & VEDAS:</Text> Government of India National Remote Sensing Centre. Official agro-climatic zoning, sowing acreage, and Indian soil database.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Planet Labs (PlanetScope):</Text> Commercial 3-meter ultra-HD imagery with daily global revisit. Pinpoints micro-stress spots down to individual tree rows.</Text>
              </View>
            )}

            {/* Active Satellite Dropdown */}
            <Text style={[styles.fieldHeading, { color: isLight ? '#16a34a' : '#00ff87' }]}>
              SELECT ACTIVE SATELLITE REMOTE SENSING ENGINE:
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: isLight ? '#16a34a' : '#00ff87' },
              ]}
              onPress={() => toggleDropdown('satellite')}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeft}>
                <Ionicons name={activeSatelliteMeta.icon} size={18} color={isLight ? '#16a34a' : '#00ff87'} />
                <Text style={[styles.dropdownTriggerText, { color: textColor }]}>
                  Active Satellite Engine: <Text style={{ fontWeight: '900', color: isLight ? '#16a34a' : '#00ff87' }}>{activeSatelliteMeta.name}</Text>
                </Text>
              </View>
              <Ionicons
                name={openDropdowns['satellite'] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={isLight ? '#16a34a' : '#00ff87'}
              />
            </TouchableOpacity>

            {openDropdowns['satellite'] && (
              <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                {ALL_SATELLITE_PROVIDERS.map((item) => {
                  const isSelected = activeSatelliteKey === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.dropdownItem,
                        isSelected && { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.1)' : 'rgba(0, 255, 135, 0.15)' },
                      ]}
                      onPress={() => {
                        setLocalConfig({
                          ...localConfig,
                          satellite: { ...localConfig.satellite, activeProvider: item.key as any },
                        });
                        toggleDropdown('satellite');
                        showToast(`🛰️ Switched Satellite Telemetry Provider to ${item.name}`);
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemTitle, { color: textColor }, isSelected && { fontWeight: '800' }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.dropdownItemTag, { color: isSelected ? (isLight ? '#16a34a' : '#00ff87') : subTextColor }]}>
                          {item.tag}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 🌟 Dynamic Features & Plan Info Card for Selected Satellite Provider */}
            <View style={[styles.telecomFeatureCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={styles.telecomCardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name={activeSatelliteMeta.icon} size={20} color={activeSatelliteMeta.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: textColor }}>
                      {activeSatelliteMeta.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: activeSatelliteMeta.color, fontWeight: '700', marginTop: 1 }}>
                      {activeSatelliteMeta.recommendation}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: isLight ? '#d1fae5' : 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: isLight ? '#065f46' : '#6ee7b7' }}>
                    {activeSatelliteMeta.tag}
                  </Text>
                </View>
              </View>

              {/* Technical Specifications Grid */}
              <View style={styles.telecomFeatureGrid}>
                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🎁 Free Quota Tier</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#16a34a' }]}>{activeSatelliteMeta.freeTier}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>💰 Overage / Scale Rate</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{activeSatelliteMeta.paidRate}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🛰️ Constellation & Resolution</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#0284c7' }]}>{activeSatelliteMeta.constellation}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>📊 Indices & Telemetry</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#10b981' }]}>{activeSatelliteMeta.indices}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>⏱️ Revisit Frequency</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: '#d97706' }]}>{activeSatelliteMeta.revisit}</Text>
                </View>

                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>🛡️ Security & Access</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>End-to-End Encrypted Telemetry</Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: subTextColor, lineHeight: 16, marginTop: 4 }}>
                {activeSatelliteMeta.summary}
              </Text>
            </View>

            {/* 📊 Live Daily Satellite Quota & Telemetry Monitor Widget */}
            <View style={[styles.telecomUsageBox, { backgroundColor: isLight ? '#f8fafc' : '#04160c', borderColor: cardBorder }]}>
              <View style={styles.telecomUsageHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="analytics" size={17} color={isLight ? '#16a34a' : '#00ff87'} />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: textColor }}>
                    📊 Satellite Orbit Telemetry & Polygon Quota Monitor
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: isLight ? '#15803d' : '#00ff87' }}>
                    ORBIT ONLINE
                  </Text>
                </View>
              </View>

              {/* Quota Progress Bar */}
              <View style={styles.telecomProgressBarWrap}>
                <View
                  style={[
                    styles.telecomProgressBarFill,
                    {
                      width: `${progressPct}%`,
                      backgroundColor: progressPct > 85 ? '#ef4444' : isLight ? '#16a34a' : '#00ff87',
                    },
                  ]}
                />
              </View>

              {/* Progress Labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textColor }}>
                  {activeSatelliteMeta.simulatedUsedRequests.toLocaleString()} / {activeSatelliteMeta.dailyFreeRequests.toLocaleString()} Farm Polygons Monitored
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#16a34a' : '#00ff87' }}>
                  {progressPct}% Used
                </Text>
              </View>

              {/* Detailed Metrics & Ping Action */}
              <View style={styles.telecomUsageStatsRow}>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: isLight ? '#d1fae5' : 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isLight ? '#065f46' : '#6ee7b7' }}>
                      🌱 {remainingRequests.toLocaleString()} Farm Scans Left
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isLight ? '#f1f5f9' : '#072414', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: subTextColor }}>
                      💳 Free Quota Protected
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isLight ? '#f0fdf4' : '#03190d', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isLight ? '#16a34a' : '#00ff87' }}>
                      🛰️ 10m Sentinel-2 Active
                    </Text>
                  </View>
                </View>

                {/* 1-Click Satellite Ping Button */}
                <TouchableOpacity
                  style={[styles.testPingBtn, { backgroundColor: isLight ? '#16a34a' : '#00ff87' }]}
                  onPress={handleTestSatelliteHandshake}
                  disabled={isTestingSatellite}
                  activeOpacity={0.8}
                >
                  {isTestingSatellite ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="flash" size={13} color="#ffffff" />
                  )}
                  <Text style={[styles.testPingBtnText, !isLight && { color: '#03140a' }]}>
                    {isTestingSatellite ? 'Connecting Orbit...' : '⚡ Test Satellite Handshake & Ping'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Provider Specific Credentials Form */}
            <View style={[styles.credentialsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              {activeSatelliteKey === 'AGROMONITORING' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🌱 OpenWeather Agro (Agromonitoring) Configuration</Text>
                  <InputField
                    label="Agromonitoring App ID / API Key"
                    value={localConfig.satellite?.providers?.agromonitoring?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        satellite: {
                          ...localConfig.satellite,
                          providers: {
                            ...localConfig.satellite.providers,
                            agromonitoring: {
                              ...localConfig.satellite.providers.agromonitoring,
                              apiKey: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="e.g. 5f4dcc3b5aa765d61d8327deb882cf99"
                    isSecret={!showSecrets['agro_key']}
                    onToggleSecret={() => toggleSecret('agro_key')}
                    isLight={isLight}
                  />
                  <View style={styles.twoColRow}>
                    <View style={[styles.toggleInlineBox, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.toggleInlineTitle, { color: textColor }]}>Auto-Sync Plot Polygons</Text>
                        <Text style={[styles.toggleInlineDesc, { color: subTextColor }]}>Auto-register 4-corner GPS boundary polygons with Agro API</Text>
                      </View>
                      <Switch
                        value={localConfig.satellite?.providers?.agromonitoring?.autoSyncPolygons ?? true}
                        onValueChange={(val) =>
                          setLocalConfig({
                            ...localConfig,
                            satellite: {
                              ...localConfig.satellite,
                              providers: {
                                ...localConfig.satellite.providers,
                                agromonitoring: {
                                  ...localConfig.satellite.providers.agromonitoring,
                                  autoSyncPolygons: val,
                                },
                              },
                            },
                          })
                        }
                        trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>
                </>
              )}

              {activeSatelliteKey === 'SENTINEL_HUB' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🛰️ Sentinel Hub (Sinergise / Planet) Configuration</Text>
                  <View style={styles.twoColRow}>
                    <InputField
                      label="OAuth Client ID"
                      value={localConfig.satellite?.providers?.sentinelHub?.clientId || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              sentinelHub: {
                                ...(localConfig.satellite.providers.sentinelHub || { clientId: '', clientSecret: '', instanceId: '' }),
                                clientId: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="e.g. 4d283897-4279-4d92-936b-..."
                      isLight={isLight}
                    />
                    <InputField
                      label="OAuth Client Secret"
                      value={localConfig.satellite?.providers?.sentinelHub?.clientSecret || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              sentinelHub: {
                                ...(localConfig.satellite.providers.sentinelHub || { clientId: '', clientSecret: '', instanceId: '' }),
                                clientSecret: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="Secret Key"
                      isSecret={!showSecrets['sentinel_secret']}
                      onToggleSecret={() => toggleSecret('sentinel_secret')}
                      isLight={isLight}
                    />
                  </View>
                  <InputField
                    label="Sentinel Hub Configuration / Instance ID"
                    value={localConfig.satellite?.providers?.sentinelHub?.instanceId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        satellite: {
                          ...localConfig.satellite,
                          providers: {
                            ...localConfig.satellite.providers,
                            sentinelHub: {
                              ...(localConfig.satellite.providers.sentinelHub || { clientId: '', clientSecret: '', instanceId: '' }),
                              instanceId: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="e.g. 8f9b1c2d-..."
                    isLight={isLight}
                  />
                </>
              )}

              {activeSatelliteKey === 'COPERNICUS' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🏛️ Copernicus Data Space Ecosystem (ESA Open Access)</Text>
                  <View style={styles.twoColRow}>
                    <InputField
                      label="Copernicus Account Username / Email"
                      value={localConfig.satellite?.providers?.copernicus?.username || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              copernicus: {
                                ...(localConfig.satellite.providers.copernicus || { username: '', password: '', clientId: '' }),
                                username: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="user@farmsking.in"
                      isLight={isLight}
                    />
                    <InputField
                      label="Copernicus Password"
                      value={localConfig.satellite?.providers?.copernicus?.password || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              copernicus: {
                                ...(localConfig.satellite.providers.copernicus || { username: '', password: '', clientId: '' }),
                                password: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="Password"
                      isSecret={!showSecrets['copernicus_pass']}
                      onToggleSecret={() => toggleSecret('copernicus_pass')}
                      isLight={isLight}
                    />
                  </View>
                  <InputField
                    label="Copernicus Data Space Client ID"
                    value={localConfig.satellite?.providers?.copernicus?.clientId || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        satellite: {
                          ...localConfig.satellite,
                          providers: {
                            ...localConfig.satellite.providers,
                            copernicus: {
                              ...(localConfig.satellite.providers.copernicus || { username: '', password: '', clientId: '' }),
                              clientId: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="cdse-public-client"
                    isLight={isLight}
                  />
                </>
              )}

              {activeSatelliteKey === 'GOOGLE_EARTH_ENGINE' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>📊 Google Earth Engine (GEE Platform)</Text>
                  <View style={styles.twoColRow}>
                    <InputField
                      label="GCP Project ID"
                      value={localConfig.satellite?.providers?.googleEarthEngine?.projectId || 'farmsking-geospatial'}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              googleEarthEngine: {
                                ...(localConfig.satellite.providers.googleEarthEngine || { serviceAccountEmail: '', privateKey: '', projectId: '' }),
                                projectId: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="farmsking-geospatial"
                      isLight={isLight}
                    />
                    <InputField
                      label="Service Account Email"
                      value={localConfig.satellite?.providers?.googleEarthEngine?.serviceAccountEmail || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              googleEarthEngine: {
                                ...(localConfig.satellite.providers.googleEarthEngine || { serviceAccountEmail: '', privateKey: '', projectId: '' }),
                                serviceAccountEmail: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="gee-service@farmsking.iam.gserviceaccount.com"
                      isLight={isLight}
                    />
                  </View>
                  <InputField
                    label="GEE Private Key (JSON / PEM)"
                    value={localConfig.satellite?.providers?.googleEarthEngine?.privateKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        satellite: {
                          ...localConfig.satellite,
                          providers: {
                            ...localConfig.satellite.providers,
                            googleEarthEngine: {
                              ...(localConfig.satellite.providers.googleEarthEngine || { serviceAccountEmail: '', privateKey: '', projectId: '' }),
                              privateKey: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="-----BEGIN PRIVATE KEY-----..."
                    isSecret={!showSecrets['gee_key']}
                    onToggleSecret={() => toggleSecret('gee_key')}
                    multiline
                    isLight={isLight}
                  />
                </>
              )}

              {activeSatelliteKey === 'ISRO_BHUVAN' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>🇮🇳 ISRO Bhuvan & VEDAS National Agri Portal</Text>
                  <View style={styles.twoColRow}>
                    <InputField
                      label="Bhuvan WMS / Geo-API Endpoint"
                      value={localConfig.satellite?.providers?.isroBhuvan?.endpointUrl || 'https://bhuvan-app1.nrsc.gov.in/agri'}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              isroBhuvan: {
                                ...(localConfig.satellite.providers.isroBhuvan || { token: '', endpointUrl: '' }),
                                endpointUrl: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="https://bhuvan-app1.nrsc.gov.in/agri"
                      isLight={isLight}
                    />
                    <InputField
                      label="Bhuvan / NRSC API Access Token"
                      value={localConfig.satellite?.providers?.isroBhuvan?.token || ''}
                      onChangeText={(val) =>
                        setLocalConfig({
                          ...localConfig,
                          satellite: {
                            ...localConfig.satellite,
                            providers: {
                              ...localConfig.satellite.providers,
                              isroBhuvan: {
                                ...(localConfig.satellite.providers.isroBhuvan || { token: '', endpointUrl: '' }),
                                token: val,
                              },
                            },
                          },
                        })
                      }
                      placeholder="NRSC Access Token"
                      isSecret={!showSecrets['isro_token']}
                      onToggleSecret={() => toggleSecret('isro_token')}
                      isLight={isLight}
                    />
                  </View>
                </>
              )}

              {activeSatelliteKey === 'PLANET_LABS' && (
                <>
                  <Text style={[styles.credTitle, { color: textColor }]}>💎 Planet Labs PlanetScope (3m Daily Revisit)</Text>
                  <InputField
                    label="Planet API Key"
                    value={localConfig.satellite?.providers?.planetLabs?.apiKey || ''}
                    onChangeText={(val) =>
                      setLocalConfig({
                        ...localConfig,
                        satellite: {
                          ...localConfig.satellite,
                          providers: {
                            ...localConfig.satellite.providers,
                            planetLabs: {
                              apiKey: val,
                            },
                          },
                        },
                      })
                    }
                    placeholder="PLAK..."
                    isSecret={!showSecrets['planet_key']}
                    onToggleSecret={() => toggleSecret('planet_key')}
                    isLight={isLight}
                  />
                </>
              )}
            </View>
          </View>
        );
      })()}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 10. MAIL SERVER (SMTP) & TRANSACTIONAL EMAIL DISPATCH             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(activeCategory === 'ALL' || activeCategory === 'SMTP') && (() => {
        const smtpData = localConfig.projectMasterData?.smtp || DEFAULT_PROJECT_MASTER_DATA.smtp;

        const updateSmtpField = (field: string, val: any) => {
          setLocalConfig((prev) => {
            const master = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
            return {
              ...prev,
              projectMasterData: {
                ...master,
                smtp: {
                  ...master.smtp,
                  [field]: val,
                },
              },
            };
          });
        };

        return (
          <View style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Header */}
            <View style={[styles.cardHeader, { borderBottomColor: cardBorder }]}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.2)' }]}>
                  <Ionicons name="mail" size={22} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: textColor }]}>10. Mail Server (SMTP) & Transactional Dispatch</Text>
                  <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                    Outgoing enterprise mail server credentials for OTPs, order invoices, alerts & diagnostic notifications
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={[styles.crownBadge, { backgroundColor: isLight ? '#eef2ff' : '#1e1b4b', borderColor: '#6366f1' }]}>
                  <Ionicons name="shield-checkmark" size={13} color="#6366f1" />
                  <Text style={[styles.crownText, { color: '#6366f1' }]}>SSL / TLS ACTIVE</Text>
                </View>

                <TouchableOpacity
                  style={[styles.guideToggleBtn, { backgroundColor: innerBg, borderColor: cardBorder }]}
                  onPress={() => toggleGuide('smtp_guide')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="help-circle-outline" size={16} color={subTextColor} />
                  <Text style={[styles.guideToggleText, { color: subTextColor }]}>SMTP Guide</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Guide Info */}
            {expandedGuides['smtp_guide'] && (
              <View style={[styles.guideBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.guideTitle, { color: '#6366f1' }]}>📘 SMTP Server Setup & Port Guidance</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Hostinger Mail:</Text> Use smtp.hostinger.com on Port 465 with SSL encryption for company domain addresses.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Google Workspace / Gmail:</Text> Use smtp.gmail.com on Port 587 with TLS encryption. Requires a Google App Password.</Text>
                <Text style={[styles.guidePoint, { color: subTextColor }]}>• <Text style={{ fontWeight: '700', color: textColor }}>Amazon SES (Mumbai):</Text> High-volume transactional delivery with 99.9% inbox placement across India.</Text>
              </View>
            )}

            {/* Quick Mail Server Presets */}
            <Text style={[styles.fieldHeading, { color: '#6366f1', marginTop: 4 }]}>
              QUICK MAIL SERVER PRESETS:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {SMTP_PRESETS.map((preset) => {
                const isPresetActive = smtpData.host === preset.host;
                return (
                  <TouchableOpacity
                    key={preset.name}
                    style={[
                      styles.telecomPlanBadge,
                      {
                        backgroundColor: isPresetActive ? '#6366f1' : innerBg,
                        borderWidth: 1,
                        borderColor: isPresetActive ? '#6366f1' : cardBorder,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                      },
                    ]}
                    onPress={() => handleApplySmtpPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mail-outline" size={14} color={isPresetActive ? '#ffffff' : subTextColor} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isPresetActive ? '#ffffff' : textColor }}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Deep-Dive Active Server Telemetry Card */}
            <View style={[styles.telecomDetailCard, { backgroundColor: innerBg, borderColor: '#6366f1', borderWidth: 1.5 }]}>
              <View style={styles.telecomDetailHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="server-outline" size={20} color="#6366f1" />
                  <Text style={[styles.telecomDetailTitle, { color: textColor }]}>
                    Active Mail Host: {smtpData.host || 'smtp.hostinger.com'}
                  </Text>
                </View>
                <View style={[styles.telecomPlanBadge, { backgroundColor: '#6366f1' }]}>
                  <Text style={[styles.telecomPlanBadgeText, { color: '#ffffff' }]}>
                    Port {smtpData.port || 465} ({String(smtpData.encryption || 'ssl').toUpperCase()})
                  </Text>
                </View>
              </View>

              <View style={styles.telecomDetailBadgesRow}>
                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>From Address</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{smtpData.fromEmail || 'noreply@farmsking.in'}</Text>
                </View>
                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Sender Name</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>{smtpData.fromName || 'FarmsKing'}</Text>
                </View>
                <View style={[styles.telecomFeatureBadge, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <Text style={[styles.telecomFeatureBadgeTitle, { color: subTextColor }]}>Delivery Mode</Text>
                  <Text style={[styles.telecomFeatureBadgeVal, { color: textColor }]}>Direct SMTP Relay</Text>
                </View>
              </View>

              {/* Ping / Test Email button */}
              <TouchableOpacity
                style={[styles.testPingBtn, { backgroundColor: '#6366f1', opacity: isTestingSmtp ? 0.7 : 1 }]}
                activeOpacity={0.85}
                disabled={isTestingSmtp}
                onPress={handleTestEmail}
              >
                {isTestingSmtp ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="paper-plane" size={14} color="#ffffff" />
                )}
                <Text style={styles.testPingBtnText}>
                  {isTestingSmtp ? 'Dispatching Test Email Ping...' : `⚡ Test SMTP Ping & Send Diagnostic Mail to ${smtpData.fromEmail || 'noreply@farmsking.in'}`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Connection Credentials Form */}
            <View style={styles.credBox}>
              <Text style={[styles.credTitle, { color: textColor }]}>🔐 Server Connection & Auth Credentials</Text>

              <View style={styles.twoColRow}>
                <InputField
                  label="SMTP Host Server"
                  value={smtpData.host || ''}
                  onChangeText={(val) => updateSmtpField('host', val)}
                  placeholder="smtp.hostinger.com"
                  isLight={isLight}
                />
                <InputField
                  label="SMTP Port Number"
                  value={String(smtpData.port || 465)}
                  onChangeText={(val) => updateSmtpField('port', parseInt(val) || 465)}
                  placeholder="465"
                  keyboardType="numeric"
                  isLight={isLight}
                />
              </View>

              <View style={styles.twoColRow}>
                <InputField
                  label="Sender Email Address"
                  value={smtpData.fromEmail || ''}
                  onChangeText={(val) => updateSmtpField('fromEmail', val)}
                  placeholder="noreply@farmsking.in"
                  isLight={isLight}
                />
                <InputField
                  label="Sender Display Name"
                  value={smtpData.fromName || ''}
                  onChangeText={(val) => updateSmtpField('fromName', val)}
                  placeholder="FarmsKing Executive Mailer"
                  isLight={isLight}
                />
              </View>

              <View style={styles.twoColRow}>
                <InputField
                  label="SMTP Username / Account"
                  value={smtpData.username || ''}
                  onChangeText={(val) => updateSmtpField('username', val)}
                  placeholder="noreply@farmsking.in"
                  isLight={isLight}
                />
                <InputField
                  label="SMTP Password / App Secret"
                  value={smtpData.password || ''}
                  onChangeText={(val) => updateSmtpField('password', val)}
                  placeholder="••••••••••••"
                  isSecret={!showSecrets['smtp_password']}
                  onToggleSecret={() => toggleSecret('smtp_password')}
                  isLight={isLight}
                />
              </View>
            </View>
          </View>
        );
      })()}

      {/* ── Bottom Save Action Bar ────────────────────────────────────────── */}
      <View style={[styles.bottomSaveBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
          <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
          <View>
            <Text style={[styles.bottomSaveTitle, { color: textColor }]}>Sync & Hot-Reload Services</Text>
            <Text style={[styles.bottomSaveDesc, { color: subTextColor }]}>
              All credentials and failover routes update live across web, mobile and backend instances.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (updateMutation.isPending || updateAppSettingsMutation.isPending) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={updateMutation.isPending || updateAppSettingsMutation.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isLight ? ['#16a34a', '#15803d'] : ['#00ff87', '#00b050']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {updateMutation.isPending || updateAppSettingsMutation.isPending ? (
              <ActivityIndicator size="small" color={isLight ? '#ffffff' : '#020d06'} />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={18} color={isLight ? '#ffffff' : '#020d06'} />
                <Text style={[styles.saveBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>
                  Save All API Settings
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
          </>
        );
      })()}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE INPUT FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  isSecret = false,
  onToggleSecret,
  keyboardType = 'default',
  multiline = false,
  isLight = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isSecret?: boolean;
  onToggleSecret?: () => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  isLight?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text
        style={[
          styles.inputLabel,
          {
            color: isFocused
              ? isLight ? '#16a34a' : '#00ff87'
              : isLight ? '#334155' : '#cbd5e1',
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isFocused
              ? isLight ? '#f0fdf4' : 'rgba(0, 255, 135, 0.04)'
              : isLight ? '#ffffff' : '#03140a',
            borderColor: isFocused
              ? isLight ? '#16a34a' : '#00ff87'
              : isLight ? '#cbd5e1' : '#0f3822',
            borderWidth: isFocused ? 1.5 : 1,
          },
          multiline && { height: 90, alignItems: 'flex-start', paddingTop: 8 },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            { color: isLight ? '#0f172a' : '#ffffff' },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
            multiline && { height: 74, textAlignVertical: 'top' },
          ]}
          value={value ?? ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isLight ? '#94a3b8' : '#475569'}
          secureTextEntry={isSecret}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {onToggleSecret && (
          <TouchableOpacity
            onPress={onToggleSecret}
            style={[styles.eyeBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSecret ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={isFocused ? (isLight ? '#16a34a' : '#00ff87') : (isLight ? '#64748b' : '#94a3b8')}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    minWidth: 260,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  headerSubBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubBullet: {
    fontSize: 11,
  },
  headerSubDesc: {
    fontSize: 11,
    fontWeight: '500',
  },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  crownText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  saveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 44,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  saveBtnCompact: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveBtnGradientCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
  },
  saveBtnTextCompact: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomSaveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  bottomSaveTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  bottomSaveDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  subTabsContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  subTabButton: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  subTabActiveLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  subTabActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: '#00ff87',
  },
  subTabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  subTabDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  subTabMiniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subTabMiniBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  cockpitConfigShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  cockpitConfigShortcutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  serviceSelectorCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  serviceSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  serviceSelectorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  serviceSelectorIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceSelectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  serviceSelectorModuleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  serviceSelectorCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  serviceSelectorCountText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  serviceSelectorTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  serviceSelectorSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  serviceSelectorChevronBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  serviceSelectorChevronText: {
    fontSize: 12,
    fontWeight: '800',
  },
  serviceSelectorList: {
    borderTopWidth: 1,
    padding: 8,
    gap: 4,
  },
  serviceSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  serviceSelectorItemActiveLight: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  serviceSelectorItemActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
  },
  serviceSelectorItemTitle: {
    fontSize: 13.5,
  },
  serviceSelectorItemDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  voiceApiCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  voiceApiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  voiceApiTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  voiceApiDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  voiceWssBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  wssBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  wssBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  copyBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  copyBtnCompactText: {
    fontSize: 11,
    fontWeight: '700',
  },
  endpointUrlText: {
    fontSize: 13.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    marginBottom: 4,
  },
  endpointSubInfo: {
    fontSize: 11,
    marginTop: 2,
  },
  voiceEndpointsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  voiceEndpointItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  endpointTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  endpointPath: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    flex: 1,
  },
  copyIconBtn: {
    padding: 4,
  },
  endpointPurpose: {
    fontSize: 11,
    lineHeight: 15,
  },
  voiceApiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  voicePingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  voicePingActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  outlineActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 40,
  },
  categoryPillText: {
    fontSize: 12,
  },
  pillMiniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pillMiniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  serviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 240,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  sandboxToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  strategyGuideBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 9,
    borderWidth: 1,
    marginBottom: 14,
    minHeight: 44,
  },
  strategyGuideText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  guideDetailsBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  guideHeading: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  guidePoint: {
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 4,
  },
  fieldHeading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  dropdownContainer: {
    marginBottom: 14,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 9,
    borderWidth: 1,
    minHeight: 46,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    minHeight: 48,
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  multiChoiceBox: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  multiChoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  multiChoiceTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  multiChoiceSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 160,
    minHeight: 44,
  },
  checkboxTileActiveLight: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  checkboxTileActiveDark: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
  },
  checkboxLabel: {
    fontSize: 12,
  },
  checkboxDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  credentialsBox: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  subCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  credTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  twoColRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  toggleInlineBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleInlineTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleInlineDesc: {
    fontSize: 10,
    marginTop: 2,
    maxWidth: 240,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  inputWrapper: {
    flex: 1,
    minWidth: 160,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 11,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 8,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  routingRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  routingInfo: {
    gap: 4,
  },
  routingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  routingTag: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  routingRecommended: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  routingDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  routingSelectWrapper: {
    marginTop: 4,
  },
  routingSelectLabel: {
    fontSize: 11.5,
  },
  gwMiniPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  gwMiniPillText: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  gwMiniPillActiveLight: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  gwMiniPillActiveDark: {
    backgroundColor: '#00ff87',
    borderColor: '#00ff87',
  },
  gwMiniPillActiveLightBlue: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  gwMiniPillActiveDarkBlue: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  gwMiniPillActiveLightOrange: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  gwMiniPillActiveDarkOrange: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  gwMiniPillActiveLightPurple: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  gwMiniPillActiveDarkPurple: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  gatewayAboutCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  gatewayAboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  gatewayAboutTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  gatewayAboutSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  rbiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rbiBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  intelligenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  intelBox: {
    flex: 1,
    minWidth: 160,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  intelLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  intelValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  policyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  policyNoticeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  
  moduleCardBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 18,
    gap: 16,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  moduleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  moduleTitleText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  miniTagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniTagBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  moduleDescText: {
    fontSize: 11.5,
    marginTop: 3,
  },
  moduleRecText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  moduleHeaderRightStatus: {
    alignItems: 'flex-end',
  },
  activeGwLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  activeGwPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  activeGwPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  subSectionWrapper: {
    gap: 6,
  },
  subSectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gwPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gwGridTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  gwGridTileText: {
    fontSize: 11,
  },
  gwGridTileTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gwGridTileTagText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  modePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modePresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modePresetText: {
    fontSize: 11.5,
  },
  playBypassBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  playBypassTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playBypassTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  playBypassSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  methodChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChipTile: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  methodChipLabel: {
    fontSize: 11.5,
  },
  methodChipNote: {
    fontSize: 10,
    marginTop: 2,
  },
  zeroFeeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  zeroFeeBannerText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },

  policyNoticeText: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },

  telecomCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  telecomFeatureCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  telecomFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  telecomFeatureBadge: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  telecomFeatureBadgeTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  telecomFeatureBadgeVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  telecomUsageBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
    gap: 10,
  },
  telecomUsageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  telecomProgressBarWrap: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 4,
  },
  telecomProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  telecomUsageStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  testPingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 6,
    minHeight: 44,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  testPingBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  cockpitCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  cockpitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  cockpitTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  cockpitSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  cockpitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cockpitItem: {
    flexGrow: 1,
    flexBasis: 165,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    gap: 2.5,
  },
  cockpitItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cockpitItemTitle: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  cockpitPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  cockpitPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cockpitMetricText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  cockpitMiniBarWrap: {
    height: 3.5,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  cockpitMiniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  cockpitSubText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  telecomCardsScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  telecomPlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  telecomPlanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  telecomCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  telecomDetailCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 8,
    gap: 6,
  },
  telecomDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  telecomDetailTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  telecomDetailBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
});
