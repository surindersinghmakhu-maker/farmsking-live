import { Ionicons } from '@expo/vector-icons';
import {
  SupportedPaymentGateway,
  ModulePaymentFeatureConfig,
} from '@/src/api/appSettings.api';

export type ServiceCategory =
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

export interface CategoryPill {
  key: ServiceCategory;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

export const CATEGORY_PILLS: CategoryPill[] = [
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


export interface DomainPaymentModuleMeta {
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

export const DOMAIN_PAYMENT_MODULES: DomainPaymentModuleMeta[] = [
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

export const ALL_MARKET_GATEWAYS: {
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
    summary: 'Computes proprietary agricultural indices including Spray Window Index (0-100), Delta-T, and Evapotranspiration to guide optimal spray timing and precision field application.',
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
