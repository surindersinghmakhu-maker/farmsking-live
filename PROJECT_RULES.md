# 👑 FarmsKing Project Operating Guidelines & Architecture Manifesto

> This document defines the mandatory execution standards, deployment workflows, UI/UX aesthetics, and system rules for the **FarmsKing** project. Every AI assistant and developer working on FarmsKing MUST strictly follow these rules.

---

## 0. 🔤 100% Pure English Language Standard
- **Strict English UI**: All user-facing UI text, buttons, modals, headings, badges, admin dashboards, system messages, and technical documentation MUST be written in **100% pure professional English language**.
- No mixed-language text or local slang in core application interfaces unless explicitly requested by the user for a specific multi-language component.

---

## 1. ⚛️ 100% Pure React Stateful Architecture & Valid Styles
- **Full React Binding**: Every feature, page, dashboard view, drawer, and modal MUST be built using **100% React Stateful Architecture** (React Hooks `useState`/`useEffect`/`useCallback`, React Context, React Query `@tanstack/react-query`, and custom Expo Router navigation hooks).
- **Zero Runtime Errors**: All callbacks (`handleOpenQuickView`, `onApprove`, `onReject`, `onReview`, modal toggles, search modals) MUST be explicitly defined, fully typed, and verified to ensure zero `is not defined` errors.
- **Strict React Native Style Compliance**: Always use valid React Native style properties (e.g., `backgroundColor` instead of `background`). NEVER pass `backgroundImage`, `backgroundSize`, or `backgroundPosition` directly to React Native `<View>`. For web-specific gradient overlays, cleanly isolate them inside `Platform.OS === 'web'` using standard DOM elements (`<div>`) so that runtime "Invalid style property" red toast warnings NEVER appear.
- **Permanent Design Tokens**: Build reusable, modular React components so features remain stable without requiring repetitive re-work ("var var change na krna pave").

---

## 2. 📱💻 Mandatory Mobile App-First View & Universal Responsive Layout
- **Mobile View (<768px) [MANDATORY NATIVE APP EXPERIENCE]**:
  - **Bottom Tab Bar Rule**: In mobile app view, navigation tabs MUST strictly be positioned at the **BOTTOM** (`bottom: 0`, standard 5-tab mobile navigation: Home, Products, Users, Finance, More). **NEVER place the main navigation tabs at the top of mobile screens.**
  - **Clean Native App Feel**: Compact vertically scrollable layouts, touch-optimized cards, standard touchable ripple effects, sliding bottom sheets, and zero awkward desktop badges or double headers on mobile.
  - **Full Mobile Feature Parity**: Every administrative tool, ledger, report, and filter accessible on desktop MUST be accessible on mobile through the bottom "More" tab or dedicated mobile screens.
- **Tablet View (768px - 1024px)**: Dual-column adaptive grids, quick action shortcut bars, and horizontal scrolling pill tabs.
- **Desktop Computer View (>1024px)**: 2-Level Executive Workspace with left ecosystem sidebar, top segmented tabs bar, spotlight search bar (`Ctrl + K`), 99.9% uptime health indicator, wide-screen multi-metric KPI cards, and side-by-side verification drawers (`maxWidth: 1400px` centered container).

---

## 3. 🌟 Super Premium 5-Star Rating UI/UX & ISO Quality Standards
- **World-Class SaaS Benchmarks**: Design quality inspired by global tech leaders (Apple Executive UI, Stripe Dashboard, Linear, and John Deere Operations Center).
- **Royal Aesthetics**: 
  - Rich emerald green (`#16a34a`, `#15803d`), midnight dark glassmorphism (`#04180d`, `#0f172a`), neon glowing green accents (`#00ff87`), royal gold (`#f59e0b`), and indigo AI highlights (`#4f46e5`).
  - 3D glowing KPI metric cards, micro-animations, glassmorphic hover effects, and real-time live telemetry meters (Google Gemini 2.5 Flash Telemetry).
- **ISO Quality & Security Standards**:
  - Apply **ISO 9001** (Quality Management) for seamless user journeys, zero dead-end screens, and instant 1-click approvals.
  - Apply **ISO 27001** (Data Security & Role Integrity) for strict role-based access control (Crop Doctor strictly linked to Farmers; Garden Doctor strictly linked to Gardeners; Super Admin full audit trail).
- **Executive & Understandable Terminology**: Use concise, executive, high-clarity wording that is immediately understandable for farmers, store sellers, advisors, and platform administrators.

---

## 4. 🚀 Automated Build & Deployment Workflow
- **Local Web Build**: Always run `node build.js` to compile both `frontend` and `admin` Expo Web bundles into `frontend/dist` and `admin/dist`.
- **Live Server Deployment**: Deploy changes directly to production by committing and pushing to Hostinger VPS after obtaining user approval:
  ```bash
  git add .
  git commit -m "Descriptive commit message"
  git push hostinger main
  ```
- **Zero-Friction Execution**: Solve issues directly in code/configuration without making the user perform manual browser or CLI steps.

---

## 5. 💰 Wallet, Referral & Payout Integrity
- **Welcome Cash Bonus**: Offered ONLY to users who registered via a coupon code or referral link (`isEligibleForWelcomeBonus`). Automatically hidden once claimed (`isWelcomeClaimed = true`).
- **Paid Plan Referral Income**: Issued when referred users purchase/activate paid plans.
- **Admin Wallet Management**:
  - Direct access to `AdminWalletManagementView`.
  - Comprehensive Active Balance Holders Directory with manual credit (`+ Credit`), deduction (`- Deduct`), and full ledger inspection.

---

## 6. 🌐 SEO & AI Search Engine Standards (GEO)
- **Google SEO**: Maintain `sitemap.xml` and `robots.txt` in `frontend/public/` listing all key routes with daily/weekly change frequencies.
- **Google Search Console Verification**: Maintain `<meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />` in `frontend/app/+html.tsx` and static HTML files.
- **AI Search Engines (GEO)**: Maintain `llms.txt` in `frontend/public/` so ChatGPT, Perplexity, and Google Gemini can index and recommend FarmsKing.

---

## 7. 🛠 Backend & Database Reliability
- **Hostinger Production Server**: Node.js / NestJS backend managed via PM2 (`farmsking-backend`) on Hostinger VPS.
- **Prisma Schema**: Maintain exact schema relationships and field definitions (e.g. `WithdrawalRequest` with `businessPartnerId` and `requestedAmount`).
- **Database Self-Healing**: Backend services run background sync routines to guarantee referral balance integrity.

---

## 8. 🏢 FarmsKing India Private Limited — Corporate Governance & Company Rules

> **Corporate Legal Identity**: All platform features, business workflows, admin controls, and operational policies must align with the official charter of **FarmsKing India Private Limited** (under the Companies Act, 2013 and MCA guidelines).

### 🏛️ The 6 Corporate MoA Mandates (Company Objects):
1. **Digital Farming & Precision Agri Platform**:
   - Deliver automated farm accounting, crop disease diagnosis, satellite NDVI health monitoring, precision irrigation schedules, and weather telemetry.
2. **Farmer Education & Skill Development (Kisan Vidya)**:
   - Provide digital farming literacy, agronomist webinars, technical workshops, and rural youth skilling programs.
3. **Lok Bhalai & Rural Community Welfare (ਲੋਕ ਭਲਾਈ)**:
   - Priority focus on small and marginal farmers, distress support advisories, debt-management financial education, soil and water conservation drives, and transparent price discovery protecting farmers from market exploitation.
4. **Agri & Gardening E-Commerce Marketplace**:
   - Connect farmers, home gardeners, nursery owners, and verified input manufacturers directly for certified seeds, organic fertilizers, bio-nutrients, sprayers, and horticulture equipment with verified quality and doorstep delivery.
5. **Crop Doctor & Garden Advisor Tele-Consultations**:
   - Maintain 100% verified agricultural experts, agronomists, and garden doctors with strict role integrity and prompt consultation handling.
6. **Mandi Price Intelligence & Transparent Ledgers**:
   - Aggregate daily mandi rates, MSP benchmarks, crop profitability analytics, and automated farm expense ledgers.

### ⚖️ Regulatory, Legal & Operational Compliance Rules:
- **100% Pure English Corporate Standard**: All contracts, admin policies, user agreements, and system interfaces must strictly be in professional English.
- **Farmer Data Privacy & Security (Digital Personal Data Protection)**: Strict protection of farmer KYC, mobile numbers, land records, and payment credentials. Zero unauthorized third-party sharing.
- **Financial Audit & Ledger Integrity**: Every wallet credit, withdrawal request, cashback incentive, referral reward, and vendor payout must maintain an immutable, auditable double-entry transaction record.
- **Fair Trade & Anti-Exploitation Policy**: Transparent commission rates, zero hidden deductions for farmers, verified seller certifications, and instant dispute resolution mechanisms.
- **Corporate Brand Consistency**: Maintain the royal executive branding (`FarmsKing India Private Limited`) across all invoice PDFs, receipts, admin audit logs, and external communications.

