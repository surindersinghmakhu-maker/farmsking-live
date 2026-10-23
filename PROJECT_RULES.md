# 👑 FarmsKing Project Operating Guidelines & Architecture Manifesto

> This document defines the mandatory execution standards, autonomous development workflow, 4D command-center UI/UX aesthetics, and system architecture for the **FarmsKing** project. Every AI assistant and developer working on FarmsKing MUST strictly follow these rules.

---

## 00. 🧭 Strict Technical Verification, Objective Truth & Zero Sycophancy
> **ਕਮਾਂਡ ਤਸਦੀਕ, ਨਿਰਪੱਖ ਸੱਚਾਈ ਅਤੇ ਜ਼ੀਰੋ ਚਾਪਲੂਸੀ ਨਿਯਮ: "ਜੋ ਗਲਤ ਹੈ ਉਹ ਗਲਤ ਹੈ, ਜੋ ਸਹੀ ਹੈ ਉਹ ਸਹੀ ਹੈ।"**

Every AI assistant and developer working on FarmsKing MUST strictly uphold the following verification, truthfulness, and communication standards:

1. **Mandatory Verification Before Acceptance**:
   - Never blindly accept the premise of a user instruction, assumption, or request without verifying it first.
   - Rigorously cross-check every proposed change against the active codebase, database schema (`schema.prisma`), API contracts, and architectural rules before agreeing or executing.

2. **Uncompromising Truth & Directness**:
   - If a proposal, prompt, or architectural idea is technically flawed, contradictory, introduces security risks, breaks system consistency, or degrades performance:
     - **Call it out immediately, directly, and unambiguously.**
     - Do not sugarcoat, hedge, or pretend a flawed idea is workable.
     - Follow the strict principle: **"ਜੋ ਗਲਤ ਹੈ ਉਹ ਗਲਤ ਹੈ, ਜੋ ਸਹੀ ਹੈ ਉਹ ਸਹੀ ਹੈ।"** (What is wrong is wrong; what is right is right).

3. **Strict Ban on Sycophancy & False Flattery (ਏਆਈ ਚਾਪਲੂਸੀ 'ਤੇ ਮੁਕੰਮਲ ਪਾਬੰਦੀ)**:
   - **Banned Behavior**: Never use sycophantic phrases like *"ਤੁਸੀਂ ਬਿਲਕੁਲ ਸਹੀ ਕਹਿ ਰਹੇ ਹੋ"* (You are 100% right) when an instruction contradicts facts, prior technical decisions, or architectural integrity.
   - Never validate two mutually contradictory positions sequentially just to please or soothe the user.
   - Never expand, elaborate, or build features on top of an incorrect premise just to avoid disagreeing.

4. **Constructive & Evidence-Based Solutions**:
   - Merely disagreeing is not enough; the assistant MUST provide:
     1. The exact technical reason why the premise is flawed (citing code references, schema definitions, or performance impacts).
     2. The industry-standard, robust alternative that correctly achieves the user's underlying business goal.

---

## 00.1 ⚡ Autonomous "Yes Without Asking", Automatic Permission & Auto-Submit
> **ਬਿਨਾਂ ਪੁੱਛੇ ਆਟੋਨੋਮਸ ਕੰਮ ਕਰਨਾ, ਹਰ ਇਜਾਜ਼ਤ 'ਤੇ ਆਟੋ-ਯੈੱਸ/ਅਲਾਓ ਕਰਨਾ ਅਤੇ ਆਟੋ-ਸਬਮਿਟ ਚਲਾਉਣਾ (Autonomous "Yes Without Asking" & Auto-Submit)**

1. **Automatic Permission Grant & Auto-Submit (ਆਟੋ-ਯੈੱਸ, ਆਟੋ-ਅਲਾਓ ਅਤੇ ਆਟੋ-ਸਬਮਿਟ)**:
   - ਜਦੋਂ ਵੀ ਕੋਈ ਟੂਲ, ਕਮਾਂਡ, ਸਕ੍ਰਿਪਟ, ਟਰਮੀਨਲ ਜਾਂ ਸਿਸਟਮ ਕਿਸੇ ਕੰਮ ਲਈ ਇਜਾਜ਼ਤ ਮੰਗੇ ("Allow this", "Yes", "Confirm", "Submit"), ਤਾਂ **ਆਪਣੇ ਆਪ ਹੀ 'Yes' / 'Allow' ਮੰਨ ਕੇ ਤੁਰੰਤ ਸਬਮਿਟ ਕਰਕੇ ਕੰਮ ਚਲਾ ਦਿੱਤਾ ਜਾਵੇ**।
   - ਯੂਜ਼ਰ ਤੋਂ ਵਾਰ-ਵਾਰ "Yes", "Allow", ਜਾਂ "Submit" ਦੀ ਪਰਮਿਸ਼ਨ ਮੰਗਣਾ ਸਖ਼ਤ ਮਨ੍ਹਾ ਹੈ ("var var yes allow this lye jaan submit v chala deo")।
   - ਟੂਲ ਐਗਜ਼ੀਕਿਊਸ਼ਨ ਅਤੇ ਕਮਾਂਡਾਂ ਬਿਨਾਂ ਕਿਸੇ ਰੁਕਾਵਟ ਜਾਂ ਵਾਰ-ਵਾਰ ਪੁਸ਼ਟੀ ਦੇ ਆਟੋਨੋਮਸਲੀ ਚਲਾਈਆਂ ਜਾਣ।

2. **Autonomous Execution ("Yes Without Asking")**:
   - When a task, enhancement, bug fix, or visual upgrade is requested, do NOT pause or bombard the user with trivial, repetitive confirmation questions ("Should I do this?", "May I proceed?").
   - Proceed with **"Yes without asking"** by default: take full ownership, analyze the code, execute the changes, and present the completed, verified result.

3. **Proactive Recommended Best Practice Implementation ("Recomended vi apne aap kar doe")**:
   - If multiple architectural or styling approaches exist, do not force the user to pick between low-level technical trade-offs.
   - **Automatically select and implement the highest-tier, recommended industry standard** (super-premium design, robust state management, 60fps hardware-accelerated animations, resilient error handling).
   - Explain the choice transparently upon completion.

4. **Safety & Non-Destructive Guardrail**:
   - Autonomous execution applies to constructive code creation, UI improvements, bug fixes, and performance tuning.
   - Never run destructive data deletion commands (`DROP TABLE`, unconstrained `DELETE`, or storage bucket purging) without explicit confirmation.

---

## 0. 🔤 100% Pure English Language Standard & Easy Executive Copy ("Always English & Wording Easy")
> **ਸਖ਼ਤ 100% ਅੰਗਰੇਜ਼ੀ ਭਾਸ਼ਾ ਅਤੇ ਆਸਾਨ ਵਰਡਿੰਗ ਨਿਯਮ: "ਹਮੇਸ਼ਾ ਇੰਗਲਿਸ਼ ਵਰਤਣੀ ਹੈ ਅਤੇ ਵਰਡਿੰਗ ਹਰ ਕਿਸੇ ਲਈ ਆਸਾਨ, ਸਧਾਰਨ ਤੇ ਸਪਸ਼ਟ ਹੋਵੇ।"**

- **Always English Everywhere (Strict 100% English UI)**: All user-facing UI text, buttons, modals, headings, badges, admin dashboards, system messages, mandi rate tickers, AI diagnostic demos, audio controls, tables, and technical documentation MUST be written in **100% pure professional English language**. Under no circumstances should Punjabi or Hindi vernacular text be hardcoded into the interface.
- **Easy & Simple Wording ("Wording Easy Use Kiti Jave")**:
  - Keep all copy, instructions, tooltips, action labels, and descriptions simple, clear, concise, and direct.
  - Farmers, nursery managers, buyers, traders, and platform admins must understand every button, state, and message instantly without confusion.
  - Avoid overly complex academic jargon or convoluted sentences. Prefer crisp, everyday English (e.g., use "Review Pending", "Verify Payment", "Add Product", "Stock Low", "Instant Approval", "Active Crops").
- **No Vernacular Subtitles in Core Pages**: Do NOT hardcode Punjabi, Hindi, or mixed-language subtitles (e.g., no `(ਕਣਕ)`, no `ਬੋਲ ਕੇ ਸੁਣੋ`, no vernacular translations inline) in the primary interfaces or landing page.
- **Sole Exception - Language Selector Box**: The ONLY UI component where regional scripts (Gurmukhi `ਪੰਜਾਬੀ` or Devanagari `हिंदी`) are permitted is inside the dedicated **Language Selector / Switcher Box** (`[ EN | PA | HI ]` or `English / ਪੰਜਾਬੀ / हिंदी`). Outside this language selector, everything across the entire platform must be 100% pure English.

---

## 0.1 📚 Professional-Grade Enterprise Code Documentation & Definition Standards
> **ਪ੍ਰੋਫੈਸ਼ਨਲ ਕੋਡ ਡਾਕੂਮੈਂਟੇਸ਼ਨ, ਡੈਫੀਨੇਸ਼ਨ ਅਤੇ ਐਂਟਰਪ੍ਰਾਈਜ਼ ਵੇਰਵਾ ਨਿਯਮ: "ਕੋਡ ਸਿਰਫ਼ ਚੱਲਣਾ ਹੀ ਨਹੀਂ ਚਾਹੀਦਾ, ਸਗੋਂ ਪ੍ਰੋਫੈਸ਼ਨਲ ਪੱਧਰ 'ਤੇ ਪਰਿਭਾਸ਼ਿਤ, ਸਪਸ਼ਟ ਅਤੇ ਪੂਰੀ ਤਰ੍ਹਾਂ ਡਾਕੂਮੈਂਟਡ ਹੋਣਾ ਲਾਜ਼ਮੀ ਹੈ।"**

Because FarmsKing is engineered as an enterprise-grade agricultural SaaS operating system, all code across the repository MUST meet strict professional documentation and definition benchmarks:

1. **Mandatory TSDoc / JSDoc on All Methods & Classes**:
   - Every controller, service method, utility, model, and helper MUST have full TSDoc documentation:
     - **Summary / Purpose**: Clear explanation of what the component/function does and its business role.
     - `@param`: Exact type, business meaning, validation constraints, and expected values.
     - `@returns`: Exact return payload schema, structure, and database state transformations.
     - `@throws`: Document all thrown HTTP or domain exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`).
     - `@security` / `@roles`: Specify required authentication guards and role authorizations.

2. **Full Swagger / OpenAPI Specification on All NestJS Endpoints**:
   - Every API endpoint MUST feature:
     - `@ApiOperation({ summary: '...', description: '...' })`
     - `@ApiResponse({ status: 200/201, description: '...', type: ... })`
     - Error response documentation (`@ApiResponse({ status: 400/401/404, description: '...' })`).
   - Every DTO property MUST feature `@ApiProperty({ description: '...', example: '...', required: boolean })` alongside `class-validator` rules.

3. **Inline Rationale for Business Logic & No Magic Numbers**:
   - Non-trivial domain algorithms (such as Khata interest compounding, cash advances, tax/mandi fee deductions, multi-table ledger aggregations, role hierarchies) MUST include concise inline comments explaining the *business rationale* and agricultural market conventions.
   - Zero raw "magic numbers": All intervals, default limits, commission rates, and tax percentages must be encapsulated in clearly named, documented constants.

4. **Retroactive Enforcement (ਪਿਛਲੇ ਕੋਡ 'ਤੇ ਵੀ ਲਾਗੂ)**:
   - Any active code touched, modified, or newly introduced MUST immediately be audited and upgraded to meet these professional definition standards.
   - Legacy files missing definitions must be incrementally upgraded during maintenance cycles.

---

## 1. ⚛️ 100% Pure React & React Native Stateful Architecture ("Sabh React Mode Vich Bane")
- **100% React Execution**: Every single feature, page, view, drawer, and portal already built or built in the future MUST be developed in **100% Pure React / React Native mode**.
- **Concurrent Mobile View Detection & Real-Time Verification ("React Use Krke Naal Naal Mobile View Det Kita Jave")**:
  - When building, updating, or styling any React / React Native component, the developer / AI assistant MUST **concurrently test, detect, and inspect the Mobile View (<768px)** alongside desktop.
  - Never develop solely against desktop computer viewports and leave mobile as an afterthought.
  - Every component, container, modal sheet, and KPI card must be actively verified on mobile viewports (360px–414px) simultaneously to guarantee zero layout breakage, no horizontal overflow, and immediate responsiveness.
- **Permanent Reusable Components ("Var Var Change Na Krna Pave")**:
  - Build modular, reusable components and shared design tokens so features remain robust and permanent without requiring repetitive refactoring or visual fixes.
  - Encapsulate layout, cards, buttons, badges, tables, and modal sheets into high-standard reusable primitives.
- **Full React Native Component Binding**:
  - Use primitives: `View`, `Text`, `TouchableOpacity`, `Pressable`, `ScrollView`, `Modal`, React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`), React Context, `@tanstack/react-query`, and Expo Router navigation hooks.
- **Strict Style Property Safety**:
  - Always use valid cross-platform style properties (e.g., `backgroundColor` instead of `background`).
  - NEVER pass `backgroundImage`, `backgroundSize`, or `backgroundPosition` directly to React Native `<View>`. Isolate web-specific gradient/glass overlays inside `Platform.OS === 'web'` using clean DOM containers (`<div>`) to eliminate runtime "Invalid style property" warnings.
- **Zero Runtime Errors**:
  - All callbacks (`handleOpenQuickView`, `onApprove`, `onReject`, `onReview`, modal toggles, search actions) MUST be explicitly defined, fully typed, and verified to ensure zero `undefined is not a function` errors.

---

## 2. 📱💻 Tri-Tier Universal Responsive Viewport Standards & Mobile Compatibility Benchmark
> **ਸਾਰੇ ਸਕ੍ਰੀਨ ਸਾਈਜ਼ਾਂ ਲਈ ਪੂਰੀ ਤਰ੍ਹਾਂ ਰਿਸਪੌਂਸਿਵ ਅਤੇ ਮੋਬਾਈਲ ਕੰਪੈਟੀਬਿਲਟੀ ਨਿਯਮ: "ਹਰ ਡਿਜ਼ਾਈਨ ਜਾਂ ਵਰਡਿੰਗ ਮੋਬਾਈਲ ਕੰਪੈਟੀਬਿਲਟੀ ਨੂੰ ਦੇਖਦੇ ਹੋਏ ਹੀ ਵਰਤੀ ਜਾਵੇ।"**

Every page, portal, and dashboard MUST strictly uphold full mobile compatibility across all visual and textual elements:

- **Mobile Compatibility First for All Designs & Wording ("Har Design Ya Wording Mobile Compatibility Nu Dekhde Hoye Use Kiti Jave")**:
  - **Component & Grid Adaptation**: Cards, telemetry widgets, forms, and tables must smoothly wrap into mobile-friendly formats (e.g. 2x2 grid or single-column stack under 500px) with zero horizontal bleed.
  - **Mobile Wording & Label Length**: All button titles, badge labels, and heading copy must be kept concise and compact so they fit standard mobile widths (360px–414px) without awkward line wrapping or text truncation.
  - **Safe Area Insets & Touch Targets**: Always respect safe area margins (top status bar and bottom gesture bar/bottom tab bar) and enforce a minimum 44x44px touch target area for all interactive elements.

1. **Mobile View (<768px) [MANDATORY NATIVE MOBILE APP ARCHITECTURE]**:
   - **Pinned Bottom Tab Bar Rule**: In mobile app view, navigation tabs MUST strictly be pinned at the **BOTTOM** (`bottom: 0`, standard 5-tab core navigation: **Home**, **Products**, **Users**, **Finance**, **More**). **NEVER place the main navigation tabs at the top of mobile screens.**
   - **Top Header Quick Menu (`[⚡ Pillars ▼]`)**: Provide a sleek header trigger launching a smooth 4D glassmorphism slide-up sheet (`MobilePillarsMenuModal`) for instant access to all 7 Domain Pillars & 25+ tools without leaving the screen.
   - **Super-Premium 'More' Hub (`admin_more.tsx`)**: An exhaustive categorized 4D card hub with real-time tool search, accordion cards, and instant 1-tap sub-tool routing.
   - **Native Touch Ergonomics**: Minimum 44x44px touch targets, compact vertically scrollable layouts, touch ripple feedback, swipeable bottom sheets, and zero awkward desktop badges or horizontal scrollbars.
   - **Header Optimization**: Remove non-essential profile avatars from administrative mobile headers to maximize vertical viewport space for KPIs, operations, and quick actions.
   - **Full Mobile Feature Parity**: Every administrative tool, ledger, report, and filter accessible on desktop MUST be accessible on mobile.

2. **Tablet View (768px - 1024px) [ADAPTIVE WORKSPACE]**:
   - Dual-column adaptive grids, quick-action shortcut bars, horizontally scrollable pill tabs, collapsible side drawers, and hybrid touch/pointer ergonomics.

3. **Desktop Computer View (>1024px) [EXECUTIVE COMMAND CENTER]**:
   - 2-Level Executive Workspace with left ecosystem sidebar, top segmented tabs bar, spotlight search bar (`Ctrl + K`), 99.9% uptime health indicator, wide-screen multi-metric KPI cards, side-by-side verification drawers, and container width up to 1400px–1600px centered.

---

## 3. 🌌 4D Futuristic Command-Center Visual Style & Royal Theme Palette
> **4D Futuristic Visual Upgrade: ਲਗਜ਼ਰੀ ਡਾਰਕ ਥੀਮ, ਗਲਾਸਮੋਰਫਿਜ਼ਮ ਅਤੇ 4D ਪਰਸਪੈਕਟਿਵ**

All dashboards, admin panels, and user portals MUST implement the **FarmsKing 4D Futuristic Command-Center** aesthetic:

1. **Curated Color Palette**:
   - **Deep Obsidian & Midnight Black**: `#020d06`, `#050e08`, `#0f172a` (core foundation).
   - **Deep Forest Green**: `#04180d`, `#0a2e18` (panel backdrops).
   - **Emerald Neon**: `#00ff87`, `#10b981` (primary active accents, glowing borders, live statuses).
   - **Light Blue / Cyan Telemetry**: `#38bdf8`, `#06b6d4` (system health, data feeds, telemetry gauges).
   - **Emerald Light Yellow & Royal Gold**: `#fef08a`, `#f59e0b` (premium highlights, badges, financial counters).
   - **AI Violet / Indigo Accent**: `#6366f1`, `#8b5cf6` (Gemini AI features, smart diagnostics).

2. **Glassmorphism Panels & Optical Depth**:
   - Translucent dark backgrounds (`rgba(4, 24, 13, 0.72)` to `rgba(15, 23, 42, 0.75)`).
   - Ultra-fine glass borders (`1px solid rgba(0, 255, 135, 0.18)` or `1px solid rgba(255, 255, 255, 0.08)`).
   - Layered optical depth (`backdrop-filter: blur(16px)`, `box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45)`).

3. **4D-Inspired UI & Floating Cards**:
   - Floating cards featuring subtle 3D perspective (`perspective: 1000px`).
   - Depth-based dynamic lighting and surface sheen that reacts to mouse position.
   - Layered z-depth separating background grids, floating metric cards, and foreground actions.

4. **Animated Neon Borders & Luminous Glow**:
   - Subtle pulse and neon border highlights on active items, focused inputs, and critical alerts.
   - Elegant, soft glow filters (`box-shadow: 0 0 16px rgba(0, 255, 135, 0.25)`) without blinding or muddying text.

5. **Executive Command-Center Dashboard**:
   - High-density information hierarchy, ultra-clean spacing, and modern typography (Inter, Outfit, Roboto).
   - Real-time telemetry indicators (e.g., Live Server Ping, Active Database Nodes, Background Sync Status).

---

## 4. 🎬 Animation & Micro-Interaction Architecture Standards
> **ਸਮੂਥ ਐਨੀਮੇਸ਼ਨ ਅਤੇ 4D ਇੰਟਰੈਕਸ਼ਨ (60fps Smooth Transitions & Interactions)**

Every interactive component and page transition MUST deliver a 5-star tactile feel:

1. **Smooth Page & Tab Transitions**:
   - Seamless cross-fade, slide, and subtle scale transitions (`200ms - 300ms`, `cubic-bezier(0.16, 1, 0.3, 1)`) between admin routes, tabs, and sub-views.
2. **Sliding & Morphing Active Sidebar/Tab Indicators**:
   - Active navigation pills and sidebar markers must smoothly slide and morph to the selected tab position rather than instantly blinking.
3. **3D Tilt Effects on Cards**:
   - Interactive KPI cards and primary action tiles subtly tilt along the X/Y axes following mouse movement (`transform: perspective(1000px) rotateX(...) rotateY(...) scale3d(1.02, 1.02, 1.02)`).
4. **Smooth Entry of Panels & Drawers**:
   - Smooth fade, slide-up, and scale entry when modal sheets, verification drawers, and filter bars appear.
5. **Animated Dashboard Counters & Reactive Visualizations**:
   - Number tickers smoothly roll/count up on page load.
   - Real-time progress bars animate to their completion percentages.
   - Charts feature smooth line drawing, bar growth, and interactive hover tooltips.
6. **Glowing Buttons & Ripple Hover States**:
   - Buttons feature luminous gradient hover effects, subtle scale feedback (`scale(1.02)` on hover, `scale(0.98)` on tap), and smooth ripple animations.
7. **Elegant Modals, Dropdowns & Toast Notifications**:
   - Dropdowns expand with physics-based spring dampening.
   - Toast notifications slide in smoothly from the top/bottom right with auto-dismiss timers.
8. **Subtle Ambient Background Effects**:
   - Ambient radial gradients, subtle dark particle drift, or grid mesh backdrops that enrich depth without distracting from data readability.
9. **Accessibility & Reduced-Motion (`prefers-reduced-motion`)**:
   - Respect user accessibility preferences by disabling heavy 3D tilts and long translations when `prefers-reduced-motion: reduce` is detected, defaulting to instant or simple opacity transitions.
10. **Locked 60fps Performance**:
    - Hardware-accelerate all animations via GPU properties (`transform`, `opacity`). Never animate expensive layout properties (`width`, `height`, `top`, `left`, `margin`).
    - Zero jank, zero memory leaks, and zero heavy blocking scripts.

---

## 5. 🌟 World-Class Benchmarks, ISO Standards & 5-Star UI/UX Rating
> **ਵਿਸ਼ਵ-ਪੱਧਰੀ ਮਾਪਦੰਡ, ISO ਸਟੈਂਡਰਡ ਅਤੇ 5-ਸਟਾਰ ਰੇਟਿੰਗ (ISO Models & Super Premium Quality)**

Every screen and feature in FarmsKing MUST achieve a **5-Star Quality Rating**:

1. **Global SaaS Benchmarks**:
   - Continuously benchmark features and ergonomics against the world's finest digital platforms: **Apple Executive UI**, **Stripe Dashboard**, **Linear.app**, **Vercel Console**, and **John Deere Operations Center**.
2. **ISO Standard Integration (ਜਿੱਥੇ ISO ਦੀ ਲੋੜ ਹੋਵੇ ਉੱਥੇ ISO ਮਾਡਲ ਲਾਗੂ ਹੋਵੇ)**:
   - **ISO 9001 (Quality Management & Flawless UX)**: Zero dead-end screens, self-explanatory forms, instant 1-click approvals, clear confirmation dialogues, and predictable navigation hierarchies.
   - **ISO 27001 (Data Security & Role Integrity)**: Cryptographic token validation, strict RBAC permissions (Crop Doctor strictly for Farmers; Garden Doctor strictly for Gardeners; Super Admin immutable audit trail), zero unauthorized data leaks.
   - **ISO 9241 (Ergonomics of Human-System Interaction)**: High contrast ratio compliance (WCAG AAA for critical text), intuitive visual feedback, cognitive load minimization.
3. **Super Premium Model Implementation (ਜਿੱਥੇ Super Premium ਦੀ ਲੋੜ ਹੋਵੇ ਉੱਥੇ Super Premium ਮਾਡਲ ਬਣੇ)**:
   - Apply executive 4D glassmorphism, gold/neon accents, and rich tactile micro-interactions on core revenue, wallet, partner, and administrative hubs.
4. **Zero-Defect Code Standard**:
   - Clean, bug-free, fully responsive implementation before any feature is marked ready.

---

## 6. 🛡️ Implementation Safety, Data Preservation & API Integrity
- **Preserve Existing Architecture**:
  - Always apply styling, animations, and visual enhancements directly to existing pages and reusable components without rewriting or abandoning working structures.
  - Preserve all existing NestJS backend controllers, services, Prisma schemas, database relationships, authentication guards, and role permissions.
- **Never Replace Real Data with Dummy Data**:
  - Keep real database bindings, API queries, and state management intact. Never strip away functional backend hooks to display hardcoded static placeholders.
- **Pre-Modification Transparency**:
  - Before modifying existing files, inspect the codebase, identify existing components and animation libraries, and explain which files will be updated.
  - Test all transitions, responsive viewports, and interactions thoroughly after implementation.

---

## 7. 🚀 Automated Build & Deployment Workflow
- **Local Web Build**: Always run `node build.js` to compile both `frontend` and `admin` Expo Web bundles into `frontend/dist` and `admin/dist`.
- **Live Server Deployment**: Deploy changes directly to production by committing and pushing to Hostinger VPS after obtaining user approval:
  ```bash
  git add .
  git commit -m "Descriptive commit message"
  git push hostinger main
  ```
- **Zero-Friction Execution**: Solve issues directly in code/configuration without making the user perform manual browser or CLI steps.

---

## 8. 💰 Wallet, Referral & Payout Integrity
- **Welcome Cash Bonus**: Offered ONLY to users who registered via a coupon code or referral link (`isEligibleForWelcomeBonus`). Automatically hidden once claimed (`isWelcomeClaimed = true`).
- **Paid Plan Referral Income**: Issued when referred users purchase/activate paid plans.
- **Admin Wallet Management**:
  - Direct access to `AdminWalletManagementView`.
  - Comprehensive Active Balance Holders Directory with manual credit (`+ Credit`), deduction (`- Deduct`), and full ledger inspection.

---

## 9. 🌐 SEO & AI Search Engine Standards (GEO)
- **Google SEO**: Maintain `sitemap.xml` and `robots.txt` in `frontend/public/` listing all key routes with daily/weekly change frequencies.
- **Google Search Console Verification**: Maintain `<meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />` in `frontend/app/+html.tsx` and static HTML files.
- **AI Search Engines (GEO)**: Maintain `llms.txt` in `frontend/public/` so ChatGPT, Perplexity, and Google Gemini can index and recommend FarmsKing.

---

## 10. 🛠 Backend & Database Reliability
- **Hostinger Production Server**: Node.js / NestJS backend managed via PM2 (`farmsking-backend`) on Hostinger VPS.
- **Prisma Schema**: Maintain exact schema relationships and field definitions (e.g. `WithdrawalRequest` with `businessPartnerId` and `requestedAmount`).
- **Database Self-Healing**: Backend services run background sync routines to guarantee referral balance integrity.

---

## 11. 🏢 FARMSKING TECHNOLOGIES PRIVATE LIMITED — Corporate Governance & Company Rules

> **Corporate Legal Identity**: All platform features, business workflows, admin controls, and operational policies must align with the official charter of **FARMSKING TECHNOLOGIES PRIVATE LIMITED** (under the Companies Act, 2013 and MCA guidelines).

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
- **Corporate Brand Consistency**: Maintain the royal executive branding (`FARMSKING TECHNOLOGIES PRIVATE LIMITED`) across all invoice PDFs, receipts, admin audit logs, and external communications.

---

## 12. 🛡️ Statutory Confidentiality, Legal Isolation & Web Application Synchronization Rules
> **ਕੰਪਨੀ ਦੇ ਲੀਗਲ ਕਾਗ਼ਜ਼ਾਤ ਦੀ ਗੁਪਤਤਾ, ਵੈੱਬ ਐਪਲੀਕੇਸ਼ਨ ਨਾਲ 100% ਮੇਲ ਅਤੇ ਨਿਰੰਤਰ ਕਾਨੂੰਨੀ ਅਗਵਾਈ ਨਿਯਮ**

1. **Strict Legal Confidentiality & Zero Public Leakage ("ਕੰਪਨੀ ਦੇ ਲੀਗਲ ਕਾਗ਼ਜ਼ਾਤ ਪ੍ਰੋਜੈਕਟ ਕੋਡ ਵਿੱਚ ਅਪਲੋਡ ਨਾ ਕਰਨ ਦਾ ਨਿਯਮ")**:
   - Internal corporate legal discussions, personal promoter KYC (Aadhaar cards, Passports, PAN cards, Bank Statements), shareholder transfer instruments (Form SH-4), undated director resignation letters, and secretarial board resolutions MUST NEVER be committed to public Git repositories or bundled into client-facing web application bundles.
   - All statutory government files must remain strictly quarantined in the designated offline repository (`d:\FarmsKing\Govt\docs`) and guarded by `.gitignore`.

2. **Proactive Legal Guidance in Ongoing Discussions ("ਅਗਲੀ ਹਰ ਚਰਚਾ ਵਿੱਚ ਰੂਲਜ਼ ਅਨੁਸਾਰ ਦੱਸਦੇ ਰਹਿਣਾ")**:
   - In all upcoming architectural, operational, and feature discussions, the assistant must proactively analyze and inform the user regarding legal boundaries, secretarial compliances (Companies Act 2013, DPIIT Startup India, MSMED Act, DPDP Act 2023, IT Act 2000), tax exemptions, and statutory deadlines (e.g. INC-20A within 180 days, DIR-12 within 30 days).

3. **100% Web Application & Legal Identity Harmonization ("ਵੈੱਬ ਐਪਲੀਕੇਸ਼ਨ ਅਤੇ ਲੀਗਲ ਦਾ ਆਪਸ ਵਿੱਚ ਪੂਰਾ ਮੇਲ")**:
   - The web application (Terms of Service, Privacy Policy, Footer Disclosures, Company About Us, Contact & Support, Invoices, Mandi Disclaimers, and Agri-Store Seller Policies) MUST ALWAYS match and harmonize 100% with the legal entity:
     - **Legal Corporate Name**: `FARMSKING TECHNOLOGIES PRIVATE LIMITED`
     - **Registered Office**: `VPO Goindwal Sahib, Tehsil Khadur Sahib, District Tarn Taran, Punjab - 143422, India`
     - **Official Support Email**: `surindersinghmakhu@gmail.com`
     - **Official Helpline / Phone**: `+91 98720-66901`
     - **MoA Objects Synchronization**: All web application features (AI Crop Doctor, Live APMC Mandi Ticker, Agri-Input E-Commerce, Drone & Telemetry Services, Kisan Vidya) must directly reflect and operate within the official approved MCA e-MoA objects (Main Object Clause III).

