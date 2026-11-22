# FarmsKing – Technical Risk Register & Mitigation Strategy

**Document**: `docs/TECHNICAL_RISK_REGISTER.md`  
**Generated Date**: 2026-11-23  
**Auditor**: Senior Systems Architect & Risk Management Lead  

---

## 1. Risk Evaluation Matrix

| Risk ID | Issue Description | Affected Module | Severity | Impact | Recommended Solution | Priority |
|---|---|---|---|---|---|---|
| **TR-01** | `Plant.gardenId` foreign key is currently mandatory (`String`), preventing creation of standalone plants without a garden. | Database Schema (`gardener_dashboards.prisma`) | **High** | Users cannot log single potted plants or desk flora without first creating a dummy garden. | In Phase 2 migration, alter `gardenId` to optional (`String?`) with `onDelete: SetNull` or `Cascade`. | **P1** |
| **TR-02** | Absence of dedicated `AiCreditLedger` could lead to unmetered AI vision API costs if free users execute excessive scans. | AI Integration (`backend/gemini`) | **High** | High cloud inference costs from external vision models. | Implement a unified credit ledger entity decrementing available scan tokens per tier. | **P1** |
| **TR-03** | EXIF metadata on user garden uploads could expose private home residential locations. | Media Storage / Uploads | **Medium** | Privacy risk if terrace/balcony images contain geo-coordinates. | Implement automated server-side EXIF stripping using `sharp` prior to storage upload. | **P2** |
| **TR-04** | Dual persona conflicts if a user is simultaneously a commercial Farmer and an urban Gardener. | Auth / Profile Context | **Medium** | Navigation confusion if the app defaults to only one primary dashboard. | Allow seamless one-tap profile mode switching in the user menu (`[ Farm View | Garden View ]`). | **P2** |
| **TR-05** | Shared `ADVISOR` enum could cause Crop Doctor prescriptions to appear on urban plant cases if not scoped. | Prescriptions & Expert Assignments | **Medium** | A crop farmer receiving home gardening recommendations or vice-versa. | Explicitly filter all advisor query feeds by `advisorType` (`'FARM'` vs `'GARDEN'`). | **P2** |
| **TR-06** | Large image uploads on cellular networks causing connection dropouts during plant diagnosis. | Frontend Scanner (`ai-doctor.tsx`) | **Low** | User frustration from failed uploads on weak connections. | Add client-side canvas image down-scaling (max 1280px, WebP 80%) before transmission. | **P3** |

---

## 2. Severity Classification Rationale

- **High Severity (TR-01, TR-02)**: Direct architectural constraints that would prevent feature completion or create unbounded operational costs.
- **Medium Severity (TR-03, TR-04, TR-05)**: Data privacy, user experience, and logical domain separation issues that require clean boundary guards.
- **Low Severity (TR-06)**: Frontend performance optimization that can be handled through standard client-side image compression.
