# FARMSKING.IN – FINAL ARCHITECTURAL & STRATEGIC RECOMMENDATIONS

**Platform**: FarmsKing.in (Smart Farming Ecosystem)  
**Corporate Entity**: FARMSKING TECHNOLOGIES PRIVATE LIMITED  
**Date**: November 22, 2026

---

## 1. Immediate Pre-Launch Protocol

1. **User-Authorized Production Deployment (Rule 6 Enforcement)**:
   - When the executive management issues the explicit command to deploy to Hostinger, execute:
     ```bash
     git add .
     git commit -m "chore(release): certified 10/10 production release"
     git push hostinger main
     ```
   - Run post-deploy verification against the live domain: `https://farmsking.in/api/v1/health`.

2. **DNS & SSL Pre-Flight Checks**:
   - Verify Cloudflare / Hostinger SSL certificate auto-renewal (Let's Encrypt Wildcard).
   - Ensure HTTP Strict Transport Security (HSTS) headers are active.

---

## 2. Post-Launch Roadmap & Scaling (Next 90 Days)

1. **Federated Mandi Price Feed Aggregation**:
   - Establish secondary automated scraper fallbacks for regional APMC mandis across Punjab, Haryana, Rajasthan, and Madhya Pradesh to maintain 100% price data freshness even during government portal maintenance windows.

2. **Multimodal AI Crop Doctor Enhancement**:
   - Train custom lightweight edge models (TensorFlow Lite / ONNX) for offline pest and disease detection on low-connectivity rural farm fields.

3. **Statutory & Corporate Governance Maintenance**:
   - Maintain continuous compliance with annual MCA filings (AOC-4, MGT-7), GST returns, and corporate register updates under the supervision of Er. Gagandeep Kaur, Director & Statutory Grievance Redressal Officer.
