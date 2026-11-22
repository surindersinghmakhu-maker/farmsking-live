# FarmsKing – Complete Role-Wise QA Discovery Report & Test Account Matrix

**Document Reference**: `docs/qa-role-discovery-report.md`  
**Generated Date**: 2026-11-23  
**Entity**: FARMSKING TECHNOLOGIES PRIVATE LIMITED  
**Universal QA Password**: `Test@1234`  
**Universal QA / Dev OTP**: `123456`  
**API Base URL**: `http://localhost:3000/api/v1`  
**Web Portals**: 
- Client Portal (Farmer, Gardener, Customer, Trader): `http://localhost:8081`
- Partner Portal (Advisor, Doctor, Seller, Nursery): `http://localhost:8081/partner-login`
- Admin & Operations Portal: `http://localhost:8082`

---

## 1. Executive Summary & Architecture Overview

FarmsKing employs a unified, multi-tiered role and identity architecture built upon a single PostgreSQL database via Prisma ORM and NestJS backend microservices. User identities support multi-role assignments (`roles: Role[]`), with primary role designation, sub-role parameters, fine-grained permission arrays, and distinct portal gating (`CLIENT`, `PARTNER`, `ADMIN`).

All 16 platform roles defined in the Prisma schema and business tier variations (Free Farmer vs Paid Farmer) have been discovered, analyzed, and populated with isolated QA test accounts equipped with standard verification fixtures.

---

## 2. Phase 1: Comprehensive Role Discovery

### 2.1 Complete Discovered Roles (Prisma `Role` Enum)

| Group | Role Identifier | Display Title | Gated Portal | Primary Access Surface |
|---|---|---|---|---|
| **Staff** | `SUPER_ADMIN` | QA Super Admin | `ADMIN` | Admin Web Console (`localhost:8082`) |
| **Staff** | `ADMIN` | QA Admin Executive | `ADMIN` | Admin Web Console (`localhost:8082`) |
| **Staff** | `MANAGER` | QA Operations Manager | `ADMIN` | Admin Web Console (`localhost:8082`) |
| **Staff** | `OPERATOR` | QA Support Operator | `ADMIN` | Support & Inquiries Console (`localhost:8082`) |
| **Staff** | `TECHNICAL_TRAINER` | QA Technical Trainer | `ADMIN` | Training & Content Studio (`localhost:8082`) |
| **Staff** | `ACCOUNTANT` | QA Platform Accountant | `ADMIN` | Financial Vouchers & Ledgers (`localhost:8082`) |
| **Partner** | `AGENT` | QA Sales Partner | `PARTNER` | Partner Console (`localhost:8081/partner-login`) |
| **Partner** | `ADVISOR` (Crop) | Dr. QA Crop Doctor | `PARTNER` | Agronomist Tele-Care & Rx Studio |
| **Partner** | `ADVISOR` (Garden) | Dr. QA Garden Advisor | `PARTNER` | Urban Garden Advisory & Plant Clinic |
| **Partner** | `NURSERY_OWNER` | QA Nursery Grower | `PARTNER` | Live Sapling & Batch Inventory |
| **Partner** | `SELLER` | QA Certified Agri Dealer | `PARTNER` | Agri Input Store & Order Dispatch |
| **Client** | `FARMER` (Free) | QA Free Cultivator | `CLIENT` | Web App (`localhost:8081`) / Farm Tab |
| **Client** | `FARMER` (Paid VIP) | QA Paid Cultivator | `CLIENT` | Full Satellite Telemetry & Bahi-Khata |
| **Client** | `CUSTOMER` | QA Retail Buyer | `CLIENT` | Organic Store & Direct Mandi Orders |
| **Client** | `TRADER` | QA Mandi Trader | `CLIENT` | Bulk Grain Procurement & APMC Bids |
| **Client** | `GARDENER` | QA Terrace Gardener | `CLIENT` | Balcony & Rooftop Garden Manager |
| **Client** | `SUPERVISOR` | QA Field Supervisor | `CLIENT` | Delegated Farm Tasks & Plot Operations |
| **Client** | `LABOUR` | QA Field Worker | `CLIENT` | Daily Attendance & Wage Passbook |

---

### 2.2 Sub-Roles & Tier Specializations

1. **Farmer Tiers**:
   - **Free Farmer** (`FarmerPlan.plan = 'FREE'`): Limited to basic crop cycles, manual weather lookup, free APMC modal rates.
   - **Paid Farmer** (`FarmerPlan.plan = 'VIP'` / `'PRO'` / `'SMART'` / `'SUPER'`): Unlocks Sentinel-2 multispectral vegetation canopy telemetry (NDVI), digital Bahi-Khata ledger, automated commission agent (Arhtiya) interest reconciliation, spray dose calculations, and priority agronomist consultation.
2. **Advisor Specializations**:
   - **Crop Doctor** (`advisorType = 'FARM'`): Certified agronomist with PAU / ICAR alignment, crop pathology diagnostic desk, e-prescription generation, and commercial farm crop season passes.
   - **Garden Advisor** (`advisorType = 'GARDEN'`): Urban horticulture specialist handling balcony gardens, ornamental flora, indoor foliage, and organic soil potting mixtures.
3. **Delegated Farm Roles**:
   - **Supervisor** (`employerFarmerId` relation): Operates plots on behalf of a primary farmer with granular `supervisorPermissions` (e.g. `['manage_crops', 'record_expenses', 'manage_labour', 'view_satellite']`).
   - **Labour Worker** (`employerFarmerId` & `LabourWorker` entity): Tracked for daily shifts, piece-rate harvests, and wage settlement vouchers (`defaultDailyWage: 450`).

---

### 2.3 Role Hierarchy & Permission Matrices

#### Staff Hierarchy
$$\text{SUPER\_ADMIN} \succ \text{ADMIN} \succ \text{MANAGER} \succ \text{OPERATOR} \parallel \text{ACCOUNTANT} \parallel \text{TECHNICAL\_TRAINER}$$

- **`SUPER_ADMIN`**: Full platform authority including secret management, payment gateway API credentials, SMS gateway switches, user hard deletion, and database backups.
- **`ADMIN`**: User status management, coupon generation, advisor allocation, market rate publication, and compliance records.
- **`MANAGER`**: Daily operational monitoring, ticket assignment, and order tracking.
- **`OPERATOR`**: Scoped permissions (`operatorPermissions: ['VIEW_FARMERS', 'ANSWER_INQUIRIES', 'CALL_SUPPORT', 'VIEW_CROPS', 'MANAGE_TICKETS']`).
- **`ACCOUNTANT`**: Financial ledger audit, seller payouts, plan subscription receipts, and GSTIN invoice reports.
- **`TECHNICAL_TRAINER`**: Educational guides, video tutorials, and agronomist protocol manuals.

---

### 2.4 Authentication & Portal Gating Architecture

1. **Client Portal (`portal: 'CLIENT'`)**:
   - Target Roles: `FARMER`, `GARDENER`, `CUSTOMER`, `TRADER`, `SUPERVISOR`, `LABOUR`.
   - Primary Login: Mobile OTP via `POST /api/v1/auth/send-login-otp` and `POST /api/v1/auth/verify-login-otp`.
   - Security Guard: Dedicated Staff roles are blocked from authenticating via Client portal to prevent accidental credential leakage.
2. **Partner Portal (`portal: 'PARTNER'`)**:
   - Target Roles: `ADVISOR`, `SELLER`, `NURSERY_OWNER`, `AGENT`.
   - Primary Login: Mobile + Password via `POST /api/v1/auth/login` (with `portal: 'PARTNER'`).
   - Requirements: Profile verification, professional qualifications, license documents, and UPI bank details.
3. **Admin Portal (`portal: 'ADMIN'`)**:
   - Target Roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `OPERATOR`, `ACCOUNTANT`, `TECHNICAL_TRAINER`.
   - Primary Login: Mobile + Password or Dedicated Staff OTP via `POST /api/v1/auth/login` (with `portal: 'ADMIN'`).
   - Security Guard: Enforces `ADMIN_STAFF_ROLES` whitelist. Rejects standard client credentials.

---

## 3. Phase 2: Complete QA Test Account Matrix

All 18 QA test accounts are seeded in the database with active status, verified phone numbers, pre-hashed password (`Test@1234`), and pre-configured test records.

| # | Role | Test Mobile | Kings ID | Password | QA OTP | Auth Portal | Dashboard Route / Target Surface | Seeded Test Fixtures |
|---|---|---|---|---|---|---|---|---|
| **1** | `SUPER_ADMIN` | `9000000001` | `KINGS-00001` | `Test@1234` | `123456` | `ADMIN` | `localhost:8082` (Admin Portal) | Global Platform Authority, All Staff Permissions |
| **2** | `ADMIN` | `9000000002` | `KINGS-00002` | `Test@1234` | `123456` | `ADMIN` | `localhost:8082` (Admin Portal) | Full Admin Management Suite |
| **3** | `MANAGER` | `9000000003` | `KINGS-00003` | `Test@1234` | `123456` | `ADMIN` | `localhost:8082` (Operations) | Operations & Ticket Management |
| **4** | `FARMER` (Free) | `9000000004` | `KINGS-00004` | `Test@1234` | `123456` | `CLIENT` | `localhost:8081` (Farm Tab) | Free Plan, 5-Acre Farm, Mustard Crop |
| **5** | `FARMER` (Paid VIP) | `9000000005` | `KINGS-00005` | `Test@1234` | `123456` | `CLIENT` | `localhost:8081` (Farm Tab) | VIP Pass, 25-Acre Farm, Wheat Crop, Supervisor & Labour |
| **6** | `CUSTOMER` | `9000000006` | `KINGS-00006` | `Test@1234` | `123456` | `CLIENT` | `localhost:8081` (Shop & Orders) | Organic Retail Customer Profile |
| **7** | `AGENT` | `9000000007` | `KINGS-00007` | `Test@1234` | `123456` | `PARTNER` | `localhost:8081/partner-login` | Business Sales Partner, Referral Code `AG900007` |
| **8** | `ADVISOR` (Crop) | `9000000008` | `KINGS-00008` | `Test@1234` | `123456` | `PARTNER` | `localhost:8081/partner-login` | Dr. QA Crop Doctor, M.Sc Agronomy (PAU), Rx Desk |
| **9** | `ADVISOR` (Garden) | `9000000009` | `KINGS-00009` | `Test@1234` | `123456` | `PARTNER` | `localhost:8081/partner-login` | Dr. QA Garden Advisor, B.Sc Horticulture |
| **10** | `NURSERY_OWNER` | `9000000010` | `KINGS-00010` | `Test@1234` | `123456` | `PARTNER` | `localhost:8081/partner-login` | QA Nursery, Kinnow & Marigold Sapling Batches |
| **11** | `OPERATOR` | `9000000011` | `KINGS-00011` | `Test@1234` | `123456` | `ADMIN` | `localhost:8082` (Operator Support) | Support Operator, All 5 Operator Permissions |
| **12** | `TECHNICAL_TRAINER` | `9000000012` | `KINGS-00012` | `Test@1234` | `123456` | `ADMIN` | `localhost:8082` (Trainer Studio) | Content Author & Farmer Training Manager |
| **13** | `ACCOUNTANT` | `9000000013` | `KINGS-00013` | `Test@1234` | `123456` | `ADMIN` | `localhost:8082` (Finance & Tax) | Platform Accountant, Ledger & Payout Reports |
| **14** | `SELLER` | `9000000014` | `KINGS-00014` | `Test@1234` | `123456` | `PARTNER` | `localhost:8081/partner-login` | Certified Dealer, Bio-NPK Fertilizer Inventory |
| **15** | `TRADER` | `9000000015` | `KINGS-00015` | `Test@1234` | `123456` | `CLIENT` | `localhost:8081` (Mandi Procurement) | APMC Licensed Mandi Grain Trader |
| **16** | `GARDENER` | `9000000016` | `KINGS-00016` | `Test@1234` | `123456` | `CLIENT` | `localhost:8081` (Garden Tab) | Terrace Gardener, Rooftop Organic Garden |
| **17** | `SUPERVISOR` | `9000000017` | `KINGS-00017` | `Test@1234` | `123456` | `CLIENT` | `localhost:8081` (Supervisor Mode) | Assigned to Paid Farmer `9000000005`, All 6 Permissions |
| **18** | `LABOUR` | `9000000018` | `KINGS-00018` | `Test@1234` | `123456` | `CLIENT` | `localhost:8081` (Worker Passbook) | Assigned to Paid Farmer `9000000005`, ₹450 Daily Wage |

---

## 4. Verification Checklist & Test Procedures

### Procedure A: Client Role Login (OTP Method)
1. Navigate to `http://localhost:8081/login`.
2. Enter mobile number: e.g. `9000000005` (Paid Farmer) or `9000000004` (Free Farmer).
3. Request OTP.
4. Enter standard QA OTP: `123456`.
5. Expected Result: Authentication successful, redirected to `/farm` or corresponding client view.

### Procedure B: Partner Role Login (Password Method)
1. Navigate to `http://localhost:8081/partner-login`.
2. Enter mobile number: e.g. `9000000008` (Crop Doctor) or `9000000014` (Seller).
3. Enter password: `Test@1234`.
4. Expected Result: Authentication successful, portal grants access to partner workspace.

### Procedure C: Admin / Staff Login (Admin Console Method)
1. Navigate to `http://localhost:8082`.
2. Enter mobile number: e.g. `9000000001` (Super Admin) or `9000000002` (Admin).
3. Enter password: `Test@1234` or request Staff OTP (`123456`).
4. Expected Result: Access granted to executive administrative dashboards.

---

## 5. Maintenance & Database Seeding Script

The automated seeding script is versioned at:
`scripts/seed_qa_test_accounts.js`

To re-run or refresh all 18 QA accounts at any time:
```bash
node scripts/seed_qa_test_accounts.js
```

All accounts are idempotent and will safely upsert without corrupting existing records.
