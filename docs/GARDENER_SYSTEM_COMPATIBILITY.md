# FarmsKing – Gardener System Compatibility & Integration Analysis

**Document**: `docs/GARDENER_SYSTEM_COMPATIBILITY.md`  
**Generated Date**: 2026-11-23  
**Objective**: Evaluate integration of the proposed Gardener Portal & Garden Doctor / Planner without disrupting existing platform systems.

---

## 1. System Integration Analysis

### A. Proposed Module: Gardener Portal
- **Feature Requirements**:
  1. Garden Profiles: Home, terrace, balcony, indoor, outdoor.
  2. Independent Plant Records: Ability to log a potted plant without creating a full garden.
  3. Plant Photo Timeline: Visual progress of growth and leaf condition over time.
  4. Care Log & Reminders: Daily watering, periodic organic feeding, seasonal pruning, repotting.
  5. Garden Expenses: Potting mix, planters, tools, pest sprays.
  6. Gardener Subscription: Free tier (up to 10 plants) vs Premium Urban Pass.
- **Architectural Fit**:
  - `Garden` and `Plant` entities exist in `backend/prisma/schema/gardener_customer_business_partner_dashboards.prisma`.
  - Making `Plant.gardenId` optional allows standalone plants.
  - `GardenExpense` is already operational.
  - Zero conflict with the Farmer portal because `Garden` is isolated by `gardenerId` and `Farm` is isolated by `ownerId`.

---

### B. Proposed Module: AI Plant Doctor (Houseplants & Urban Flora)
- **Feature Requirements**:
  1. Plant Identification from leaf photo.
  2. Pathology diagnosis: Spider mites, powdery mildew, root rot, overwatering stress, yellowing foliar tips.
  3. Tailored biological remedies: Neem oil emulsification, compost tea, hydrogen peroxide root drench.
  4. AI Credit Ledger: Tracking free vs paid diagnostic scans per user.
- **Architectural Fit**:
  - The underlying vision engine (`Gemini 1.5 Flash / Pro`) is already integrated in `backend/src/modules/gemini/`.
  - Adding a dedicated urban plant prompt persona ensures diagnostics output domestic remedies rather than industrial agriculture chemical recommendations.
  - An `AiCreditLedger` entity can track both farm crop scans and gardener plant scans seamlessly.

---

### C. Proposed Module: Garden Doctor / Garden Planner
- **Feature Requirements**:
  1. Professional Dashboard for certified horticulturists and garden designers.
  2. Client Assignment & Consent: Gardeners book a 1-on-1 consultation or 90-day garden maintenance plan.
  3. Digital Prescription (Rx): Soil mix recipes, fertilization schedules, light exposure plans.
  4. Landscape Planning: Balcony layouts, terrace weight load guidance, companion planting schemes.
  5. Doctor Earnings & Payout: Professional advisory fees settled directly to the doctor's bank account.
- **Architectural Fit**:
  - Reuses the existing `GardenExpertPlan` and `GardenExpertAssignment` database models.
  - Reuses the existing `WithdrawalRequest` and `Wallet` microservices for doctor fee payouts.
  - Zero collision with commercial Crop Doctors; differentiated cleanly by `advisorType: 'GARDEN'`.

---

### D. Proposed Module: Admin Controls
- **Feature Requirements**:
  1. Gardener Plan Pricing & Trial controls.
  2. Garden Doctor certification verification and onboarding approval.
  3. AI Credit allocation limits per subscription tier.
  4. Dispute and inquiry resolution desk.
- **Architectural Fit**:
  - Implemented cleanly within the existing Admin Console (`/admin`) using modular tab extensions.

---

## 2. Regression & Impact Assessment

| Platform Vertical | Risk Level | Isolation Mechanism |
|---|---|---|
| **Farmer Operations** | **ZERO RISK** | Farmers operate under `Farm`, `Plot`, and `CropCycle`. All endpoints are partitioned by role guards. |
| **Bahi-Khata Accounting** | **ZERO RISK** | Farm ledgers use `Party` and `SaleBill`. Garden expenses use isolated `GardenExpense`. |
| **Mandi Price Feeds** | **ZERO RISK** | APMC wholesale rates remain dedicated to commercial crop trading. |
| **E-Commerce Store** | **POSITIVE IMPACT** | Store catalog seamlessly surfaces garden items (potting soil, seeds, shears) to gardeners. |
| **Crop Doctors** | **ZERO RISK** | Crop Doctors retain `advisorType: 'FARM'`; Garden Doctors operate under `advisorType: 'GARDEN'`. |
