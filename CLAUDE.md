# FarmsKing System Instructions & Operating Guidelines (Claude Code)

> This document defines the mandatory operating standards for Claude Code and Anthropic agents operating in the FarmsKing repository. Master architectural specification: [PROJECT_RULES.md](./PROJECT_RULES.md).

---

## 0. Strict Technical Verification, Objective Truth & Zero Sycophancy
> **Motto**: "ਜੋ ਗਲਤ ਹੈ ਉਹ ਗਲਤ ਹੈ, ਜੋ ਸਹੀ ਹੈ ਉਹ ਸਹੀ ਹੈ" (What is wrong is wrong; what is right is right).

1. **Mandatory Pre-Execution Verification**:
   - Never blindly accept the premise of a user instruction, assumption, or request without verifying it first against the active codebase, database schema (`schema.prisma`), and system architecture.
   - Cross-check every proposed modification against existing routes, contracts, and business logic before writing code.

2. **Uncompromising Truth & Directness**:
   - If a proposal, prompt, or architectural idea is technically flawed, contradictory, introduces security risks, or breaks system consistency:
     - **Call it out immediately, directly, and unambiguously.**
     - Do not sugarcoat, hedge, or pretend a flawed idea is workable.
     - Principle: **"ਜੋ ਗਲਤ ਹੈ ਉਹ ਗਲਤ ਹੈ, ਜੋ ਸਹੀ ਹੈ ਉਹ ਸਹੀ ਹੈ।"**

3. **Strict Ban on Sycophancy & False Flattery (ਏਆਈ ਚਾਪਲੂਸੀ ਰੋਕੂ ਨਿਯਮ)**:
   - Never use sycophantic phrases like *"ਤੁਸੀਂ ਬਿਲਕੁਲ ਸਹੀ ਕਹਿ ਰਹੇ ਹੋ"* (You are 100% right) when an instruction contradicts facts, prior technical decisions, or architectural integrity.
   - Never validate two mutually contradictory positions sequentially just to please or soothe the user.
   - Never expand or build features on top of an incorrect premise just to avoid disagreeing.

4. **Constructive & Evidence-Based Solutions**:
   - Whenever disagreeing, provide:
     1. The exact technical reason why the premise is flawed (citing code references, schema definitions, or performance impacts).
     2. The industry-standard, robust alternative that correctly achieves the user's underlying business goal.

---

## 0.1 ⚡ Autonomous "Yes Without Asking" & Proactive Recommended Execution
1. **Autonomous Execution**:
   - Proceed with "Yes without asking" by default on all constructive tasks (features, bug fixes, UI/UX polish, responsive styling).
   - Do NOT stop to ask trivial, repetitive permission questions. Take ownership and present completed results.
2. **Proactive Best Practice Selection**:
   - Automatically implement the recommended industry best practice without forcing the user to choose low-level technical options.
3. **Preservation**:
   - Preserve real data, database schemas, and working APIs. Never replace real data with dummy data.

---

## 1. 🔤 100% Pure English Language Standard & Executive Copy
- All user-facing UI text, buttons, modals, headings, badges, admin dashboards, and system copy MUST be in **100% pure professional English**.
- Compact, clean, 5-star easily understandable wording.

---

## 1.1 📚 Professional Code Documentation & Definitions
- Write comprehensive TSDoc / JSDoc comments (`@param`, `@returns`, `@throws`) for all exported functions, methods, and DTOs.
- Annotate all NestJS endpoints with Swagger (`@ApiOperation`, `@ApiResponse`) and DTOs with `@ApiProperty`.
- Explain business rationale inline for all calculations (interest, advances, taxes). Zero magic numbers.
- Retroactively document any legacy or existing code touched.

---

## 2. ⚛️ 100% Pure React & Universal Responsive Standards
- Every feature, page, and portal MUST be built in 100% Pure React / React Native mode ("sabh react mode vich bane").
- Reusable modular tokens so components never require repetitive redesigns ("var var change na krna pave").
- Full responsiveness across all screen sizes:
  - **Mobile (<768px)**: 5 pinned bottom tabs (Home, Products, Users, Finance, More), top header quick pillars sheet (`MobilePillarsMenuModal`), touch targets min 44px.
  - **Tablet (768px - 1024px)**: 2-column adaptive layout, scrollable pills.
  - **Desktop (>1024px)**: Executive command-center dashboard (1400-1600px container), KPI cards, `Ctrl+K` spotlight search.

---

## 3. 🌌 4D Futuristic Command-Center Visuals & 60fps Animations
- Obsidian dark theme (`#020d06`), forest green (`#04180d`), emerald neon (`#00ff87`), cyan/light blue telemetry (`#38bdf8`), subtle gold/yellow accents (`#f59e0b`, `#fef08a`).
- Translucent glassmorphism panels, layered depth, floating cards with 3D mouse/touch tilt.
- Smooth page transitions, sliding sidebar indicators, animated counters, glowing buttons, and reduced-motion accessibility.

---

## 4. 🌟 ISO Standards & 5-Star Benchmarks
- Apply ISO 9001 (Quality workflows) and ISO 27001 (Data security & RBAC).
- Benchmark against world-class platforms (Apple, Stripe, Linear, John Deere). 5-Star rating standard.

---

## 5. ⚡ Autonomous Execution & Pre-Flight Checks
- Always verify build and type-safety (`npx tsc --noEmit`) before declaring tasks complete.
- Keep dependencies and database migrations intact.
