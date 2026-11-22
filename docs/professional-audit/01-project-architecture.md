# FARMSKING.IN – MASTER PROJECT ARCHITECTURE DOCUMENT
**Document ID**: `DOC-ARCH-01`  
**Audit Standard**: Enterprise SaaS & Statutory Agritech (ISO 9001:2015 & ISO 27001:2022 Aligned)  
**Corporate Entity**: FARMSKING TECHNOLOGIES PRIVATE LIMITED  
**CIN**: `U62013PB2026PTC070389` | **PAN**: `AAHCF3566C` | **TAN**: `AMRF11527F`  
**Date**: November 2026 | **Version**: 2.0.33  

---

## 1. EXECUTIVE ARCHITECTURE OVERVIEW

FarmsKing (`farmsking.in`) is an enterprise-scale, multi-tenant Agri-Tech and Precision Agronomy SaaS platform built to unify Indian agriculture, horticulture, rural finance, and plant pathology. The application architecture is structured as a full-stack monorepo featuring three core runtime tiers:

1. **Backend REST API & WebSocket Micro-Engine** (NestJS 10, Prisma ORM 6.4.0, Neon Serverless PostgreSQL).
2. **Public Web & Farmer Client Application** (Expo 51, React 18, React Native Web, Expo Router 3.5).
3. **Enterprise Admin Governance Console** (Dedicated high-security administration console running on port 8082 / `admin.farmsking.in`).

```
                              ┌─────────────────────────────────────────┐
                              │     CLIENT INTERACTION TIER             │
                              ├────────────────────┬────────────────────┤
                              │   Public Web &     │   Admin Enterprise │
                              │   Farmer App       │   Governance       │
                              │   (Port 8081)      │   (Port 8082)      │
                              └─────────┬──────────┴──────────┬─────────┘
                                        │                     │
                                        │ HTTPS / WSS         │ HTTPS / WSS
                                        ▼                     ▼
                              ┌─────────────────────────────────────────┐
                              │      BACKEND CORE ENGINE (Port 3000)    │
                              │      NestJS 10 Modular Architecture     │
                              │   62 Controllers • 68 Services • Guards │
                              └────────────────────┬────────────────────┘
                                                   │
                         ┌─────────────────────────┼─────────────────────────┐
                         ▼                         ▼                         ▼
             ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
             │ DATABASE LAYER       │  │ EXTERNAL INTEGRATIONS│  │ CLOUD & MEDIA        │
             │ Neon PostgreSQL      │  │ PhonePe & Cashfree   │  │ Sentinel Hub Sat.    │
             │ Prisma ORM (118 Mod.)│  │ Meta WhatsApp Cloud  │  │ Google Gemini AI     │
             │ 80 Multi-Tenant Enums│  │ Agora Real-time Audio│  │ Shiprocket Logistics │
             └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## 2. TECHNOLOGY STACK & TOOLCHAIN

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | Node.js | v22.23.3 LTS | Core execution environment across all tiers |
| **Package Management** | npm workspaces | 10.x | Monorepo dependency orchestration |
| **Backend Framework** | NestJS | 10.4.x | Enterprise TypeScript backend framework |
| **Database Engine** | PostgreSQL (Neon) | 16.x Serverless | Relational data persistence with connection pooling |
| **ORM / Schema Layer** | Prisma ORM | 6.4.0 | Type-safe database queries & multi-file schema management |
| **Frontend Framework** | Expo / React Native Web | Expo 51 / RN 0.74 | Cross-platform web & mobile application |
| **Routing System** | Expo Router | 3.5.x | File-system-based routing with deep-link support |
| **State Management** | React Context & Query | React 18 / TanStack | Client-side reactive cache and session state |
| **CSS & Design Engine**| React Native StyleSheet | Hardware Accel. | High-performance 60fps responsive layout |
| **Authentication** | JWT & Passport | RFC 7519 / Argon2 | Stateless bearer token authentication & OTP verification |
| **Audio/Video Engine** | Agora RTC SDK | `agora-token` | In-app real-time tele-consultations between farmers and agronomists |
| **AI Pathology Engine** | Google Gemini & OpenAI | Multimodal Vision | Sub-850ms crop leaf disease diagnosis & treatment recommendation |
| **Satellite Remote Sensing** | Sentinel-2 L2A API | Copernicus / SH | Multispectral vegetation index (NDVI, EVI, Moisture) |

---

## 3. MONOREPO DIRECTORY STRUCTURE

```
farmsking/
├── admin/                         # Enterprise Administrator Console
│   ├── app/                       # Expo Router screens for admin
│   ├── components/                # 397+ specialized management widgets & cards
│   ├── constants/                 # Admin theme, metrics & menu hierarchies
│   ├── src/api/                   # Typed API clients for backend admin endpoints
│   └── package.json               # Admin dependencies (Expo 51, React 18)
│
├── backend/                       # NestJS 10 Core REST & WebSocket API
│   ├── prisma/
│   │   ├── schema/                # 20 modular schema files
│   │   │   ├── base.prisma        # Datasource & generator config
│   │   │   ├── enums.prisma       # 80 enterprise domain enums
│   │   │   ├── users_farms_plots_crops.prisma
│   │   │   ├── farmer_advisor_plan_subscription_schedule_uploads_.prisma
│   │   │   ├── market_rates_notifications.prisma
│   │   │   ├── section_860.prisma # Dynamic platform governance & settings
│   │   │   └── ... (14 more modular schema partitions)
│   ├── src/
│   │   ├── common/                # Guards, interceptors, decorators, utils
│   │   │   ├── guards/            # JwtAuthGuard, RolesGuard, OptionalJwtAuthGuard
│   │   │   └── utils/             # Role policies, phone sanitizers, calculations
│   │   ├── modules/               # 65 domain-driven NestJS modules
│   │   │   ├── auth/              # Mobile OTP, registration, JWT issuance
│   │   │   ├── users/             # Multi-role profiles & KYC verification
│   │   │   ├── farms/ & plots/    # Agricultural land and boundary management
│   │   │   ├── crops/             # Crop cycle cultivation logs
│   │   │   ├── market-rates/      # Live APMC mandi rate ingest & historical cache
│   │   │   ├── crop-problems/     # AI Crop Doctor pathology requests & expert reviews
│   │   │   ├── phonepe/ & cashfree/ # Payment webhooks, gateway verification, payouts
│   │   │   ├── app-settings/      # Dynamic platform governance parameters
│   │   │   ├── satellite/         # Sentinel Hub satellite remote sensing
│   │   │   └── ... (56 more specialized micro-modules)
│   │   ├── app.module.ts          # Root module aggregating all sub-modules
│   │   └── main.ts                # Application bootstrap, Swagger, CORS, Helmet
│   └── package.json               # Backend dependencies (NestJS, Prisma, Argon2)
│
├── frontend/                      # Public Web & Farmer Client Platform
│   ├── app/                       # Expo Router application structure
│   │   ├── (auth)/                # Login, register, partner login, forgot password
│   │   ├── (user)/(tabs)/         # Farmer core tabs (Farm, Doctor, Mandi, Store, etc.)
│   │   ├── (partner)/(tabs)/      # Advisor, Doctor & Trainer management portal
│   │   ├── +html.tsx              # Master HTML document, SEO schema, OpenGraph
│   │   ├── index.tsx              # Public high-converting landing page
│   │   ├── shop.tsx               # Agri Store marketplace
│   │   ├── compliance.tsx         # Statutory MCA, ISO & corporate disclosures
│   │   └── contact-us.tsx         # Official grievance & helpline desk
│   ├── components/                # Modular UI components & design system
│   ├── constants/                 # Theme tokens, palettes, typography, translations
│   ├── src/store/                 # Auth context, cart context, socket context
│   └── package.json               # Frontend dependencies (Expo 51, React Native Web)
│
├── shared/                        # Shared cross-tier TypeScript models and modals
│   └── components/                # FarmerPlanUpgradeModal, CropCarePlanModal, etc.
│
├── Govt/docs/                     # Statutory isolated legal dossiers (.gitignore protected)
│   ├── 00_Directors_Official_Signatures/
│   ├── 05_BOARD_RESOLUTION_ORGANIZATION_DSC_GAGANDEEP_KAUR.pdf
│   └── 17_PantaSign_Company_Organization_DSC_Kit/
│
├── docs/                          # Architecture, audit dossiers & user documentation
│   └── professional-audit/        # Master audit deliverable folder
└── package.json                   # Root monorepo workspace orchestration
```

---

## 4. DATABASE ARCHITECTURE (NEON POSTGRESQL + PRISMA ORM)

The database schema is partitioned into **20 modular Prisma schema files** (`backend/prisma/schema/*.prisma`) managed by Prisma 6.4.0 multi-file capabilities, compiling to a unified PostgreSQL relational schema.

### Core Domain Statistics:
- **Total Relational Models**: 118 models.
- **Total Domain Enums**: 80 enums.
- **Tenant & Entity Segregation**: Explicit foreign keys on `userId`, `farmId`, `plotId`, `cropCycleId`, `advisorId`.

### Key Relational Clusters:
1. **Identity & Access Governance**:
   - `User`: Primary identity model supporting 16 distinct roles (`Role` enum), KYC status, King ID, verified badges, village/district/state geo-indexing.
   - `AuditLog` & `IsoAuditLog`: Immutable change tracking for critical operations.
2. **Agronomy & Field Operations**:
   - `Farm` ➔ `Plot` ➔ `CropCycle`: 3-tier hierarchy representing farmer land holdings, distinct field plots, and seasonal crop cycles.
   - `CropActivitySchedule`, `Spray`, `Fertilizer`, `IrrigationRecord`, `Harvest`: Cultivation execution logs.
3. **Plant Pathology & Tele-Agronomy**:
   - `CropProblem`, `CropProblemPhoto`: Farmer disease submissions with AI confidence score, pathogen classification, and doctor review status.
   - `AdvisorPlan`, `AdvisorSubscription`: Crop Care human advisory plans.
   - `CropCycleInstallment`: 3-stage milestone installment payments (40% Sowing, 35% Flowering, 25% Harvest).
4. **Marketplace & Mandi Intelligence**:
   - `MarketRate`: Live APMC mandi commodity arrival rates across 50+ crops.
   - `Product`, `CustomerOrder`, `CustomerOrderItem`: Certified bio-input store.
   - `SellerStore`, `SellerPayout`, `ShippingLog`: Multi-vendor e-commerce with Shiprocket integration.
5. **Dynamic Governance & Platform Configuration**:
   - `AppSetting`: Dynamic real-time settings table allowing administrators to configure platform fee percentages, installment stage percentages, SLA response windows, and support contacts without requiring code rebuilds.

---

## 5. USER ROLES & ACCESS CONTROL ARCHITECTURE (RBAC)

The platform supports **16 specialized user roles** defined in `backend/prisma/schema/enums.prisma`:

| Role | Domain Scope | Primary Dashboards & Permissions |
| :--- | :--- | :--- |
| **FARMER** | Commercial & Progressive Cultivators | Farm management, AI Crop Doctor, Live Mandi, Bahi-Khata ledger, Agri Store |
| **ADVISOR** | Certified Agronomists & Crop Doctors | Prescription writing, video consultations, farmer patient queue, installment payouts |
| **GARDENER** | Urban Terrace & Balcony Growers | Urban gardening kits, plant health tracking, garden expert consultations |
| **CUSTOMER** | Retail Consumers & Buyers | Fresh farm-direct food orders, delivery tracking, product reviews |
| **AGENT** | Commission Agents & Village Facilitators | Farmer onboarding, transaction synchronization, referral commissions |
| **SELLER** | Certified Bio-Input Manufacturers | Vendor catalog management, inventory, order fulfillment, payout requests |
| **TRADER** | APMC Mandi Bulk Grain Buyers | Live commodity bidding, weighment settlements, mandi conversion passes |
| **TECHNICAL_TRAINER** | Field Agronomy Trainers | Farmer field workshops, training certifications, knowledge dissemination |
| **NURSERY_OWNER** | Live Plant Nursery Operators | Sapling listings, live plant shipping, wholesale nursery batches |
| **LABOUR** | Farm Field Workers & Harvesters | Wage records, attendance logs, task completion tracking |
| **ACCOUNTANT** | Corporate & Arhtiya Bookkeepers | Bahi-Khata ledgers, interest calculations, tax deduction records |
| **SUPERVISOR** | Regional Agricultural Supervisors | Field dispute resolution, advisor verification, farmer escalations |
| **OPERATOR** | Mandi Telemetry Operators | Daily APMC mandi rate data entry, verification, price anomaly flagging |
| **MANAGER** | Platform Operations Managers | User verification approvals, catalog moderation, support oversight |
| **ADMIN** | Executive Corporate Administrators | Full operational console, user management, financial settlements |
| **SUPER_ADMIN** | Board of Directors & System Architects | Master platform configuration, database governance, statutory compliance |

---

## 6. SUBSCRIPTION & MONETIZATION ARCHITECTURE

The platform implements two strictly separated subscription models:

```
                                  ┌─────────────────────────────────────┐
                                  │   FARMSKING TWO-MODEL SYSTEM        │
                                  └──────────────────┬──────────────────┘
                                                     │
                   ┌─────────────────────────────────┴─────────────────────────────────┐
                   ▼                                                                   ▼
       ┌───────────────────────────────┐                   ┌────────────────────────────────────────┐
       │ 1. FARMER PLAN                │                   │ 2. CROP CARE PLAN                      │
       │ (Farm Records & Calculations) │                   │ (Human Advisory & Crop Care)           │
       ├───────────────────────────────┤                   ├────────────────────────────────────────┤
       │ • Free Plan (1 Crop / Basic)  │                   │ • Certified Doctor & Scientist Service │
       │ • Kisan Plan (Full Bahi-Khata)│                   │ • 1-on-1 In-App Video/Audio Calls      │
       │ • Boss Plan (Multi-Plot/Export│                   │ • In-Season Disease Prescriptions      │
       │ • Farmer VIP Plan (Unlimited) │                   │ • 3-Stage Milestone Installments:      │
       │ Unlocks software capabilities │                   │   Stage 1 (Sowing): 40% upfront        │
       │ and data storage limits.      │                   │   Stage 2 (Flowering): 35% mid-season  │
       └───────────────────────────────┘                   │   Stage 3 (Harvest): 25% pre-harvest   │
                                                           │ Default 80% to Doctor / 20% Platform   │
                                                           └────────────────────────────────────────┘
```

1. **Farmer Plan (Farm Records & Account Management)**:
   - Designed for farmers to manage their comprehensive agricultural records directly on the platform.
   - Includes crop cultivation logs, acreage tracking, yield estimates, daily expenditure, digital bahi-khata (khatavani), commission agent (Arhtiya) interest calculations, and mandi conversion records.
   - Tiered plans: `Free Plan` (1 crop limit), `Kisan Plan`, `Boss Plan`, `Farmer VIP Plan`.
2. **Crop Care Plan (Doctor & Advisor Consultation)**:
   - Designed for professional agronomy guidance and plant pathology.
   - Certified Crop Doctors and Farm/Garden Advisors offer consultation plans where they charge their professional advisory fee to farmers and guide them throughout the crop cycle with spray schedules, disease diagnosis, and treatment recommendations.
   - Features flexible **3-Stage Milestone Installments**:
     - Stage 1 (Sowing/Basal): 40% payable upfront to initiate care.
     - Stage 2 (Mid-Season Flowering): 35% due at Day 45.
     - Stage 3 (Pre-Harvest/Yield): 25% due at Day 90.
   - Governed dynamically by admin settings (`cropCareInstallmentStage1Percent`, `cropCareInstallmentStage2Percent`, `cropCareInstallmentStage3Percent`).

---

## 7. THIRD-PARTY INTEGRATIONS & EXTERNAL SERVICES

| Service | Provider | Architecture Flow | Fallback / Fail-Safe |
| :--- | :--- | :--- | :--- |
| **Payment Gateway** | PhonePe PG | Server-to-server checksum validation + webhook handler | Cashfree PG / Direct UPI VPA (`UPI_PAYEE_VPA`) |
| **Payouts & Settlement** | Cashfree Payouts | Automated bank transfer via IFSC/Account validation | Manual Admin Ledger Voucher Verification |
| **In-App Tele-Consult** | Agora RTC Engine | Dynamic temporary channel tokens generated on backend | Fallback direct dial with number masking |
| **AI Disease Diagnosis** | Google Gemini Multimodal | 800ms image analysis with agronomy prompt engineering | OpenAI GPT-4o Vision fallback |
| **Satellite Remote Sensing** | Sentinel Hub / Copernicus | Multi-spectral NDVI/EVI tile fetches on demand | Cached regional vegetation indices |
| **SMS & OTP Dispatch** | Fast2SMS & WhatsApp | 6-digit cryptographic OTP generation with rate limits | WhatsApp Meta Cloud API template messaging |
| **Logistics & Shipping** | Shiprocket | Automated airway bill (AWB) generation & pickup dispatch | Vendor self-ship with tracking number |
| **Error Monitoring** | Sentry Node | Real-time uncaught exception capturing & profiling | Local structured JSON-L log files |

---

## 8. STATUTORY & CORPORATE COMPLIANCE INTEGRATION

All user-facing views, print templates, and system documents strictly reflect the certified corporate identity:
- **Corporate Entity**: `FARMSKING TECHNOLOGIES PRIVATE LIMITED`
- **CIN**: `U62013PB2026PTC070389` (Ministry of Corporate Affairs, ROC Chandigarh)
- **PAN**: `AAHCF3566C` | **TAN**: `AMRF11527F`
- **Statutory Registered Office**: `C/o BALDEV SINGH, VILLAGE BOOH, Kapurthala, Kapurthala, Punjab - 144601, India`
- **Operational Headquarters**: `Makhu, Ferozepur - 142044, Punjab, India`
- **Statutory Grievance Redressal Officer**: Er. Gagandeep Kaur, Director (`compliance@farmsking.in`)
- **Document Precision Standard**: Mandatory **A4 Page Setup** (`210mm × 297mm`) across all generated statutory dossiers, board resolutions, and tax invoices.

---

## 9. CONCLUSION & AUDIT ROADMAP

Phase 1 discovery confirms that FarmsKing possesses a highly sophisticated, comprehensive architectural foundation with 118 database models, 62 API controllers, and 90 frontend routes. 

Subsequent audit phases will systematically inspect page-by-page visual quality, security hardening, database integrity, and Core Web Vitals to elevate every single scorecard category to **10/10**.
