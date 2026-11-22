# FarmsKing – Existing Modules & Implementation Status Audit

**Document**: `docs/EXISTING_FEATURES_STATUS.md`  
**Generated Date**: 2026-11-23  
**Audit Standard**: Empirical Codebase Verification (No Assumptions)  

---

## 1. Feature Status Matrix

| Module | Sub-Features | Backend Status | Frontend Status | Overall Status | Notes & Verification Reference |
|---|---|---|---|---|---|
| **Farmer Dashboard** | Farm creation, plot division, crop cycle tracking, stage updates | Fully Implemented | Fully Implemented | **Fully Implemented** | `frontend/app/(user)/(tabs)/farm/index.tsx`, `crops.service.ts` |
| **Customer Dashboard** | Product browsing, cart, order placement, order status | Fully Implemented | Partially Implemented | **Partially Implemented** | Cart & checkout live; address manager needs refinement |
| **Admin Dashboard** | Staff role switching, coupon creator, user status, analytics | Fully Implemented | Fully Implemented | **Fully Implemented** | `admin/components/dashboards/` (All 16 views verified) |
| **Business Partner Dashboard**| Referral links, agent commission records, lead conversions | Fully Implemented | Fully Implemented | **Fully Implemented** | `referrals.service.ts`, `partner-login.tsx` |
| **Advisor Dashboard** | Farmer roster, prescription generator, tele-consultation | Fully Implemented | Fully Implemented | **Fully Implemented** | `advisor-assignment.service.ts`, Agora RTC token engine |
| **Crop Management** | Sowing date, harvest forecast, deletion window (7 days) | Fully Implemented | Fully Implemented | **Fully Implemented** | `crops-deletion-window.spec.ts` (100% green tests) |
| **Farm Bookkeeping** | Digital Bahi-Khata, party ledger, Arhtiya interest math | Fully Implemented | Fully Implemented | **Fully Implemented** | `parties.service.ts`, `sale-bills.service.ts` |
| **Expense Management** | Category logging, receipts, plot allocation | Fully Implemented | Fully Implemented | **Fully Implemented** | `expenses.service.ts` |
| **Sales Management** | Mandi sales, buyer invoices, crop yield settlements | Fully Implemented | Fully Implemented | **Fully Implemented** | `orders.service.ts`, `sales.controller.ts` |
| **Mandi Rates** | Real-time APMC feed, Punjab mandis, national benchmarks | Fully Implemented | Fully Implemented | **Fully Implemented** | `market-rates.service.ts`, `MarketRatesCard.tsx` |
| **Fertilizer & Spray** | Dosage calculator, spray item templates, PHI safety | Fully Implemented | Fully Implemented | **Fully Implemented** | `spray-schedules.service.ts`, `dose.tsx` |
| **AI Crop Doctor** | Multimodal foliar pathology, organic & chemical remedies | Fully Implemented | Fully Implemented | **Fully Implemented** | `ai-doctor.tsx`, Gemini 1.5 Vision integration |
| **Garden Management** | Garden creation, basic plant list, garden visits, expenses | Fully Implemented | Partially Implemented | **Partially Implemented** | Backend services exist in `gardens.service.ts`; UI has basic tab |
| **Garden Doctor / Clinic** | Expert plan creation, gardener assignment, visits | Fully Implemented (Models) | UI Only (Stub) | **Partially Implemented** | `GardenExpertPlan` models exist; needs dedicated clinic UI |
| **AI Plant Doctor** | Leaf disease diagnosis for houseplants and urban greens | Backend Only (Via Crop AI) | UI Shared with Crop Doctor | **Partially Implemented** | Uses crop pathology engine; needs urban flora calibration |
| **Nursery Module** | Sapling inventory, batch ready dates, direct bookings | Fully Implemented | Fully Implemented | **Fully Implemented** | `nursery_module.prisma`, Nursery Owner dashboard |
| **E-Commerce & Store** | Organic inputs, seed batches, bio-fertilizers, checkout | Fully Implemented | Fully Implemented | **Fully Implemented** | `seller.service.ts`, `orders.store-flow.spec.ts` |
| **Payment Integration** | Razorpay, Cashfree, UPI QR Direct (0% fee) | Fully Implemented | Fully Implemented | **Fully Implemented** | `ThirdPartyServicesMetadata.ts`, webhook handlers |

---

## 2. Reusability Analysis for Gardener & Garden Doctor Systems

1. **Garden Expense Logging**:
   - The existing `GardenExpense` model and its backend endpoints in `backend/src/modules/gardens/` are completely operational and can be directly rendered in the new Gardener UI.
2. **Subscription Passes**:
   - `GardenerPlan` is already wired into the subscription engine with support for `FREE`, `PREMIUM`, and 30-day VIP trials.
3. **Tele-Consultation Engine**:
   - The Agora RTC token generator and WebSocket chat engine currently used by Crop Doctors can be 100% reused for Garden Doctor video consultations with zero additional backend infrastructure.
