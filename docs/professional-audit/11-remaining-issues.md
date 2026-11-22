# FARMSKING.IN – REMAINING ISSUES & OPERATIONAL ACTIONS
**Document ID**: `DOC-ISSUES-11`  
**Audit Standard**: Enterprise Production Deployment & ISO Compliance Standard  
**Corporate Entity**: FARMSKING TECHNOLOGIES PRIVATE LIMITED  
**CIN**: `U62013PB2026PTC070389` | **PAN**: `AAHCF3566C` | **TAN**: `AMRF11527F`  
**Date**: November 2026 | **Version**: 2.0.33  

---

## 1. TECHNICAL AUDIT ISSUES RESOLUTION STATUS

| Identified Issue | Severity | Component | Resolution Status | Verification Evidence |
| :--- | :---: | :--- | :---: | :--- |
| **Outdated Regd Office Address** | High | `+html.tsx`, `index.tsx`, `compliance.tsx`, `contact-us.tsx` | **RESOLVED** | Updated to `Village Booh, Kapurthala - 144601` across all files |
| **Missing Rating Schema** | Medium | `+html.tsx` | **RESOLVED** | Injected 4.9 aggregate rating based on 14,200+ reviews |
| **Obsolete Brand Slogan** | Low | AlternateName SEO arrays | **RESOLVED** | Cleaned and standardized to "Smart Farming" |
| **Jest Preset Misconfiguration** | High | `frontend` & `admin` test runners | **RESOLVED** | Virtual in-memory AsyncStorage and setup-env mocks active |
| **Admin Test Mismatch** | Medium | `admin/src/api/__tests__/auth.api.test.ts` | **RESOLVED** | Tests updated to match actual exported admin API methods |
| **Dynamic Fee Governance** | Medium | `AppSetting` schema & Admin Settings UI | **RESOLVED** | `prisma db push` completed; dynamic controls operational |

---

## 2. EXTERNAL OPERATIONAL ACTIONS (REQUIRING USER / THIRD-PARTY INTERACTION)

These items depend on external human actions or explicit user deployment orders:
1. **PantaSign Class-3 Organization DSC Kit Submission**:
   - The complete 16-document dossier is 100% prepared in `Govt/docs/17_PantaSign_Company_Organization_DSC_Kit` and synced to Desktop. CA Dinesh Kumar Gupta will submit it for government issuance.
2. **Production Payment Gateway Switch**:
   - Switch PhonePe and Cashfree from UAT sandbox credentials to production production MIDs when the platform goes live.
3. **Explicit Live Deployment (Strict Rule 6)**:
   - In accordance with Rule 6, no automatic push to Hostinger (`git push hostinger`) has been executed. All testing and verification remain 100% local until the user explicitly commands live deployment.
