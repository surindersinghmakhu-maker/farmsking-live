# 👑 FarmsKing Project Operating Guidelines & Architecture Manifesto

> This document defines the mandatory execution standards, deployment workflows, UI/UX aesthetics, and system rules for the **FarmsKing** project. Every AI assistant and developer working on FarmsKing MUST strictly follow these rules.

---

## 0. 🔤 100% Pure English Language Standard
- **Strict English UI**: All user-facing UI text, buttons, modals, headings, badges, admin dashboards, system messages, and technical documentation MUST be written in **100% pure professional English language**.
- No mixed-language text or local slang in core application interfaces unless explicitly requested by the user for a specific multi-language component.

---

## 1. 🚀 Instant Full-Stack Automated Deployment
- **Web Build**: Always run `node build.js` in `frontend/` to generate the production web bundle into `frontend/dist`.
- **Live Server Deployment**: Deploy changes directly to production by committing and pushing to Hostinger VPS:
  ```bash
  git add .
  git commit -m "Descriptive commit message"
  git push hostinger main
  ```
- **Zero-Friction Execution**: Solve issues directly in code/configuration without making the user perform manual browser or CLI steps. Handle self-healing automatically.

---

## 2. 🎨 Premium Royal Aesthetics & UI Standards
- **Color Palette**: Rich emerald green (`#16a34a`, `#15803d`, `#0f172a`), royal gold (`#f59e0b`, `#fbbf24`), dark midnight contrast (`#0f172a`, `#1e293b`), and fresh gradient fills.
- **Responsiveness**: All screens MUST be fully responsive on Mobile devices and Laptops/Desktops (`maxWidth: 1200px` centered layouts).
- **Haptics & Audio**: Use Expo Haptics (`Haptics.notificationAsync`) and tap audio feedback on key actions.
- **Clean Architecture**: Use modular components, explicit type safety, and zero dummy fallback placeholders.

---

## 3. 💰 Wallet, Referral & Payout Integrity
- **Welcome Cash Bonus**: Offered ONLY to users who registered via a coupon code or referral link (`isEligibleForWelcomeBonus`). Automatically hidden once claimed (`isWelcomeClaimed = true`).
- **Paid Plan Referral Income**: Issued when referred users purchase/activate paid plans.
- **Admin Wallet Management**:
  - Direct access to `AdminWalletManagementView`.
  - Comprehensive Active Balance Holders Directory with manual credit (`+ Credit`), deduction (`- Deduct`), and full ledger inspection.
  - Safe optional chaining (`autoReport?.summary?...`) to guarantee zero runtime crashes.

---

## 4. 🌐 SEO & AI Search Engine Standards (GEO)
- **Google SEO**: Maintain `sitemap.xml` and `robots.txt` in `frontend/public/` listing all key routes with daily/weekly change frequencies.
- **Google Search Console Verification**: Maintain `<meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />` in `frontend/app/+html.tsx` and static HTML files.
- **AI Search Engines (GEO)**: Maintain `llms.txt` in `frontend/public/` so ChatGPT, Perplexity, and Google Gemini can index and recommend FarmsKing.

---

## 5. 🛠 Backend & Database Reliability
- **Hostinger Production Server**: Node.js / NestJS backend managed via PM2 (`farmsking-backend`) on Hostinger VPS.
- **Prisma Schema**: Maintain exact schema relationships and field definitions (e.g. `WithdrawalRequest` with `businessPartnerId` and `requestedAmount`).
- **Database Self-Healing**: Backend services run background sync routines to guarantee referral balance integrity.
