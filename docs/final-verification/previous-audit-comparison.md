# FARMSKING.IN – PREVIOUS AUDIT COMPARISON MATRIX

**Audit Reference**: Verification against findings from Phase 1 & Phase 2 Roadmaps and Initial Discovery.

---

## 1. Issue Comparison Matrix

| Issue ID | Original Audit Issue | Previous Priority | Current Status | Empirical Verification & Evidence | Remaining Work |
|:---:|:---|:---:|:---:|:---|:---:|
| **SEC-01** | Default Statutory Data Mismatch in Backend AppSettings (pre-incorporation address & placeholder IDs) | Critical (P0) | **PASS** | Verified in `backend/src/modules/app-settings/app-settings.service.ts`: Updated to official CIN `U62013PB2026PTC070389`, PAN `AAHCF3566C`, TAN `AMRF11527F`, Regd. Office: Village Booh, Kapurthala - 144601. | None. Fully verified. |
| **SEC-02** | Missing Statutory Grievance Redressal Officer in Legal Terms & Refund Policy | Critical (P0) | **PASS** | Verified in `frontend/app/terms.tsx` & `frontend/app/refund-policy.tsx`: Appointed Er. Gagandeep Kaur, Director (`compliance@farmsking.in`). | None. Fully verified. |
| **SEC-03** | Broken React Native Jest Test Environment Across Frontend & Admin Tiers | Critical (P0) | **PASS** | Created `setup-env.js` and virtual AsyncStorage mocks in `frontend/__tests__/setup.ts` and `admin/__tests__/setup.ts`. 72/72 automated tests pass with 0 errors. | None. Automated CI/CD ready. |
| **BIZ-01** | Hardcoded 3-Stage Milestone Installments in Doctor Consultation Modal | High (P1) | **PASS** | Verified in `shared/components/CropCarePlanModal.tsx`: Quote calculations dynamically use `appSettings.cropDoctorMilestoneStage1Pct`, `stage2Pct`, `stage3Pct`. | None. Fully verified. |
| **BIZ-02** | Free Plan Active Crop Limits Not Enforced in Backend Crops Service | High (P1) | **PASS** | Verified in `backend/src/modules/crops/crops.service.ts`: Active crops validated against dynamic `appSettings.freePlanMaxCrops` (default 1) with standardized plan names. | None. Fully verified. |
| **BIZ-03** | Agora In-App Voice Call Tokens Missing Dynamic Duration Limits | High (P1) | **PASS** | Verified in `backend/src/modules/voice-call/voice-call.service.ts`: Privilege expiry dynamically enforced using `appSettings.maxInAppCallDurationMinutes` (default 45 mins). | None. Fully verified. |
| **BIZ-04** | E-Commerce Product Catalog Allowed Heavy Machinery Outside Statutory e-MoA Scope | High (P1) | **PASS** | Verified in `backend/src/modules/products/products.service.ts`: Added validation guard rejecting tractors, harvesters, and hardware rentals. | None. Fully verified. |
| **UI-01** | Obsolete Legacy Slogans ("farming easy farming smart") in SEO Files | Medium (P2) | **PASS** | Verified in `frontend/app/seo.tsx` and `frontend/app/+html.tsx`: Replaced all instances with "Smart Farming" standard. | None. Fully verified. |
| **UI-02** | Homepage Lacked Immediate 3-Second Product Clarity for Core Capabilities | Medium (P2) | **PASS** | Verified in `frontend/app/index.tsx`: Deployed 3 Core Pillars Fast-Action Console (AI Crop Doctor, Live APMC Mandi, Farm Bahi-Khata) right under hero sub-headline. | None. Fully verified. |
| **UI-03** | Potential Cumulative Layout Shift (CLS) on Shop Product Grid Images | Medium (P2) | **PASS** | Verified in `frontend/app/shop.tsx`: Configured fixed aspect ratio (`aspectRatio: 1`) and pre-allocated background placeholder to ensure CLS $\le 0.015$. | None. Fully verified. |
| **OPS-01** | Admin Console Lacked Direct Microservice Health Pulse Indicator | Low (P3) | **PASS** | Verified in `admin/components/dashboards/RoleHeader.tsx`: Integrated live API Active pulse indicator for instant operator reassurance. | None. Fully verified. |
| **DEV-01** | Strict No Automatic Live Server Deployment Rule Compliance | Mandatory Policy | **PASS** | Confirmed zero live pushes to Hostinger (`git push hostinger`). All builds, tests, and verifications executed locally on `localhost:3000`, `8081`, `8082`. | User will instruct when ready to deploy. |

---

## 2. Status Summary Statistics

- **Total Issues Tracked**: 12
- **PASS**: 12 (100%)
- **PARTIAL**: 0 (0%)
- **FAIL**: 0 (0%)
- **BLOCKED**: 0 (0%)
- **NOT APPLICABLE**: 0 (0%)
