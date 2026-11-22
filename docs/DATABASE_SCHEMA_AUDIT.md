# FarmsKing – Database Schema Audit & Entity Analysis

**Document**: `docs/DATABASE_SCHEMA_AUDIT.md`  
**Generated Date**: 2026-11-23  
**Database**: PostgreSQL  
**ORM**: Prisma Client v6.4.0  
**Schema Architecture**: 20 Partitioned `.prisma` Files  

---

## 1. Schema Architecture & Partitioning

The database schema is organized across 20 focused schema sections in `backend/prisma/schema/`:
1. `base.prisma`: Datasource, generator, and shared extensions.
2. `enums.prisma`: Platform-wide enums (Roles, Categories, Order Statuses, Unit Types).
3. `users_farms_plots_crops.prisma`: Core identities, farms, plots, crops, and telemetry pins.
4. `gardener_customer_business_partner_dashboards.prisma`: Garden, Plant, GardenVisit, and Seller entities.
5. `section_309.prisma`: GardenExpense, GardenExpertPlan, GardenExpertAssignment, GardenerPlanPaymentRequest.
6. `section_703.prisma`: GardenerPlan, GardenerPlanCoupon.
7. `farmer_advisor_plan_subscription_schedule_uploads_.prisma`: FarmerPlan, Subscriptions, Prescriptions.
8. `nursery_module.prisma`: Live sapling batches, nursery orders.
9. `market_rates_notifications.prisma`: APMC market rates, push alerts.
10. `expenses_sales_customers_payments.prisma`: Bahi-Khata ledgers, vouchers, customer orders.
11. `labour_fertilizer_spray_harvest_inventory_machinery_irrigation.prisma`: Field operations.
12. `section_192.prisma` through `section_944.prisma`: Extended e-commerce, wallet, and logistics models.

---

## 2. Existing Garden Models Deep-Dive

The database already possesses a comprehensive set of models for urban and home gardening:

### 2.1 Model: `Garden` (`@@map("gardens")`)
- `id` (UUID, Primary Key)
- `gardenerId` (String, Foreign Key -> `User.id`, Cascade Delete)
- `name` (String): e.g. "Terrace Organic Haven"
- `location` (String, Optional): e.g. "Rooftop North"
- `area` (Float, Optional): Area in square feet
- `healthScore` (Int, Default 85): Overall garden vitality metric
- `status` (String, Default "Active")
- `createdAt`, `updatedAt` (Timestamps)
- **Relations**:
  - `plants`: `Plant[]`
  - `visits`: `GardenVisit[]`
  - `expenses`: `GardenExpense[]`

### 2.2 Model: `Plant` (`@@map("plants")`)
- `id` (UUID, Primary Key)
- `gardenId` (String, Foreign Key -> `Garden.id`, Cascade Delete)
- `name` (String): e.g. "Cherry Tomato"
- `species` (String, Optional): e.g. "Solanum lycopersicum"
- `plantedDate` (DateTime, Optional)
- `healthNotes` (String, Optional)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)
- **Constraint Identified**: `gardenId` is currently non-nullable. In order to support plants that are independent of a formal garden (e.g. standalone indoor potted plants), `gardenId` will need to become optional in Phase 2.

### 2.3 Model: `GardenExpense` (`@@map("garden_expenses")`)
- `id` (UUID, Primary Key)
- `gardenId` (String, Foreign Key -> `Garden.id`, Cascade Delete)
- `plantId` (String, Optional, Foreign Key -> `Plant.id`, SetNull)
- `category` (String): e.g. "Potting Soil", "Organic Nutrients", "Pruner"
- `amount` (Decimal, 12,2)
- `expenseDate` (DateTime, Default now)
- `notes` (String, Optional)

### 2.4 Model: `GardenExpertPlan` & `GardenExpertAssignment`
- `GardenExpertPlan`: Professional advisory offerings created by Garden Doctors (title, description, price, validityDays).
- `GardenExpertAssignment`: Links a `gardener` to an `expert` (Garden Doctor) under an active plan with status and date tracking.

### 2.5 Model: `GardenerPlan` & `GardenerPlanCoupon`
- `GardenerPlan`: Manages gardener subscription level (`plan: GardenerSubscriptionPlan` -> `FREE`, `PREMIUM`).
- Supports free VIP demo trials via `hasUsedVipTrial: Boolean` and `trialStartedAt: DateTime?`.
- `GardenerPlanCoupon`: Allows redemption of pre-paid promotional passes.

---

## 3. Schema Evaluation for Proposed Gardener System

| Proposed Requirement | Existing Database Support | Schema Changes Needed (Phase 2) |
|---|---|---|
| Garden Profiles (Home, Terrace, Balcony) | Supported (`Garden` model) | Add `gardenType` enum (`TERRACE`, `BALCONY`, `INDOOR`, `BACKYARD`) |
| Independent Plants (no garden) | Partially Supported (`Plant` model) | Make `Plant.gardenId` optional (`String?`) |
| Plant Photo & Health History | Partially Supported (`Plant.healthNotes`) | Create dedicated `PlantHealthLog` model with image URLs |
| Watering & Pruning Schedules | Supported via `GardenVisit` | Create dedicated `PlantCareTask` (watering, fertilizer, pruning) |
| Garden Expenses | Fully Supported (`GardenExpense` model) | Zero schema change required; 100% reusable |
| Gardener Subscription | Fully Supported (`GardenerPlan` model) | Zero schema change required; 100% reusable |
| AI Plant Doctor Usage & Credits | Not Implemented | Create `AiCreditLedger` & `PlantDiagnosisTicket` |
| Garden Doctor Consultation | Supported (`GardenExpertPlan/Assignment`) | Enhance with `ePrescription` and consultation chat link |

---

## 4. Integrity & Isolation Assessment

1. **Cascade Deletion**: All child records (`plants`, `visits`, `expenses`) correctly cascade when a `Garden` is deleted.
2. **Foreign Key Protection**: User isolation is guaranteed via `gardenerId` indexing on every garden query.
3. **No Migration During Audit**: In strict adherence to Rule 0 and the audit mandate, zero schema changes or migrations were executed.
