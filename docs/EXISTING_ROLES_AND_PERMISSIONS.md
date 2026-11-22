# FarmsKing – Existing Roles, Permissions & Access Control Audit

**Document**: `docs/EXISTING_ROLES_AND_PERMISSIONS.md`  
**Generated Date**: 2026-11-23  
**Entity**: FARMSKING TECHNOLOGIES PRIVATE LIMITED  

---

## 1. Role Inventory & Classification

FarmsKing implements 16 distinct role enums defined in `backend/prisma/schema/enums.prisma`. Each user possesses a primary role (`role: Role`) and an array of active roles (`roles: Role[]`), allowing multi-role personas (e.g. a user who is both a Farmer and a Seller).

### 1.1 Complete Role Matrix

| Group | Role Identifier | Gated Portal | Auth Method | Primary Dashboard Surface | Description |
|---|---|---|---|---|---|
| **Staff** | `SUPER_ADMIN` | `ADMIN` | Password / Staff OTP | `admin/` (Full Authority) | System configuration, API keys, database backups, audit logs. |
| **Staff** | `ADMIN` | `ADMIN` | Password / Staff OTP | `admin/` (Operations) | Operational management, compliance records, user moderation. |
| **Staff** | `MANAGER` | `ADMIN` | Password / Staff OTP | `admin/` (Manager Console) | Field staff assignments, ticket queues, support escalations. |
| **Staff** | `OPERATOR` | `ADMIN` | Password / Staff OTP | `admin/` (Support Desk) | Customer support, inquiry resolution, ticket handling. |
| **Staff** | `TECHNICAL_TRAINER` | `ADMIN` | Password / Staff OTP | `admin/` (Trainer Studio) | Content creation, farmer webinars, educational guides. |
| **Staff** | `ACCOUNTANT` | `ADMIN` | Password / Staff OTP | `admin/` (Financial Books) | Payment reconciliations, voucher audits, GST reporting. |
| **Partner** | `AGENT` | `PARTNER` | Password | `frontend/app/(auth)/partner-login` | Business development, referral tracking, commission payouts. |
| **Partner** | `ADVISOR` (Crop) | `PARTNER` | Password | `frontend/app/(auth)/partner-login` | Plant pathologist & agronomist tele-care for commercial crops. |
| **Partner** | `ADVISOR` (Garden) | `PARTNER` | Password | `frontend/app/(auth)/partner-login` | Urban horticulturist & garden clinic advisor (`advisorType: GARDEN`). |
| **Partner** | `NURSERY_OWNER` | `PARTNER` | Password | `frontend/app/(auth)/partner-login` | Live plant sapling inventory, batch orders, nursery batches. |
| **Partner** | `SELLER` | `PARTNER` | Password | `frontend/app/(auth)/partner-login` | Certified agri input dealer, organic bio-inputs catalog. |
| **Client** | `FARMER` (Free) | `CLIENT` | Mobile OTP | `frontend/app/(user)/(tabs)/farm` | Basic farm plots, weather, APMC modal rates. |
| **Client** | `FARMER` (Paid VIP) | `CLIENT` | Mobile OTP | `frontend/app/(user)/(tabs)/farm` | Full satellite foliar telemetry, Bahi-Khata ledger, spray calculator. |
| **Client** | `CUSTOMER` | `CLIENT` | Mobile OTP | `frontend/app/(user)/(tabs)/shop` | Retail customer buying organic products and produce. |
| **Client** | `TRADER` | `CLIENT` | Mobile OTP | `frontend/app/(user)/(tabs)/market` | APMC commodity procurement, wholesale bids. |
| **Client** | `GARDENER` | `CLIENT` | Mobile OTP | `frontend/app/(user)/(tabs)/garden` | Urban home, balcony, and rooftop plant grower. |
| **Client** | `SUPERVISOR` | `CLIENT` | Mobile OTP | `frontend/app/(user)/(tabs)/supervisor` | Delegated field supervisor linked to an employer farmer. |
| **Client** | `LABOUR` | `CLIENT` | Mobile OTP | `frontend/app/(user)/(tabs)/labour` | Daily wage farm worker passbook. |

---

## 2. Sub-Roles & Tier Variations

### 2.1 The Two Farmer Plan Models
1. **Farmer Plan (Farm Records & Account Management)**:
   - Manages plot acreage, crop stages, daily expenditure, digital bahi-khata (khatavani), and mandi vouchers.
   - Tiered via `FarmerPlan.plan` enum: `FREE`, `PRO`, `SMART`, `SUPER`, `VIP`.
2. **Crop Care Plan (Doctor & Advisor Consultation)**:
   - Certified Agronomists offer structured consultation passes (SOS Diagnosis, 120-day Crop Cycle, or Monthly Retainers).

### 2.2 Advisor Specialization (`advisorType`)
In `backend/prisma/schema/users_farms_plots_crops.prisma`:
- `advisorType: String?` takes values `'FARM'` or `'GARDEN'`.
- `FARM`: Focuses on field crops (Wheat, Paddy, Mustard, Cotton, Potato).
- `GARDEN`: Focuses on indoor plants, terrace vegetables, bonsai, succulent care, and ornamental floriculture.

### 2.3 Delegated Farm Relationships
- `SUPERVISOR`: Uses `employerFarmerId` and `supervisorPermissions: String[]` to manage crops on behalf of an owner farmer.
- `LABOUR`: Linked to `employerFarmerId` and an associated `LabourWorker` entity storing `defaultDailyWage`.

---

## 3. Portal Gating & Access Control

Access control is enforced at both the API level (`backend/src/common/utils/role-policy.util.ts`) and frontend route guards:

1. **Staff Isolation**: Staff accounts (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `OPERATOR`, `TECHNICAL_TRAINER`, `ACCOUNTANT`) cannot authenticate via standard client forms; they must use the dedicated Admin Portal (`portal: 'ADMIN'`).
2. **Client OTP Enforcement**: Client roles (`FARMER`, `GARDENER`, `CUSTOMER`, `TRADER`, `SUPERVISOR`, `LABOUR`) are prevented from password authentication to eliminate credential stuffing attacks; they authenticate via cryptographic Mobile OTP.
3. **Partner Portal**: Certified Partners (`ADVISOR`, `SELLER`, `NURSERY_OWNER`, `AGENT`) authenticate via password and must pass credential verification.

---

## 4. Gaps & Integration Readiness for Gardener System

1. **Missing Separate Role for Garden Doctor**: Currently, both Crop Doctors and Garden Doctors share the `ADVISOR` enum with a sub-type `advisorType = 'GARDEN'`. This is functional but lacks dedicated permission separation.
2. **Gardener Role Readiness**: The `GARDENER` role is already an established first-class enum in Prisma and supported by the client OTP authentication pipeline.
