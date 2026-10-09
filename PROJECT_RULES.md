# 👑 FarmsKing Project Operating Guidelines & Architecture Manifesto

> This document defines the mandatory execution standards, deployment workflows, UI/UX aesthetics, and system rules for the **FarmsKing** project. Every AI assistant and developer working on FarmsKing MUST strictly follow these rules.

---

## 0. 🔤 100% Pure English Language Standard
- **Strict English UI**: All user-facing UI text, buttons, modals, headings, badges, admin dashboards, system messages, and technical documentation MUST be written in **100% pure professional English language**.
- No mixed-language text or local slang in core application interfaces unless explicitly requested by the user for a specific multi-language component.

---

## 1. ⚛️ 100% Pure React Stateful Mode Architecture
- **Full React Binding**: Every feature, page, dashboard view, drawer, and modal MUST be built using **100% React Stateful Architecture** (React Hooks `useState`/`useEffect`/`useCallback`, React Context, React Query `@tanstack/react-query`, and custom Expo Router navigation hooks).
- **State Integrity**: All callbacks (`handleOpenQuickView`, `onApprove`, `onReject`, `onReview`, modal toggles) MUST be explicitly defined, fully typed, and verified to ensure zero `is not defined` runtime errors.
- **Permanent Design Tokens**: Build reusable, modular React components so features remain stable without requiring repetitive re-work ("var var change na krna pave").

---

## 2. 📱💻 3-Tier Universal Responsive Layout System
- **Mobile View (<768px)**: Compact vertical stacked views, touch-optimized floating action buttons, slide-in drawers, and touch-friendly navigation.
- **Tablet View (768px - 1024px)**: Dual-column adaptive grids, quick action shortcut bars, and horizontal scrolling pill tabs.
- **Desktop Computer View (>1024px)**: 2-Level Executive Workspace with left ecosystem sidebar, top sub-tabs bar, spotlight search bar (`Ctrl + K`), wide-screen multi-metric KPI cards, and side-by-side verification drawers (`maxWidth: 1400px` centered container).

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

