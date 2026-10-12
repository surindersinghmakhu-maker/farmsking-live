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

3. **Strict Ban on Sycophancy & False Flattery**:
   - Never use sycophantic phrases like *"ਤੁਸੀਂ ਬਿਲਕੁਲ ਸਹੀ ਕਹਿ ਰਹੇ ਹੋ"* (You are 100% right) when an instruction contradicts facts, prior technical decisions, or architectural integrity.
   - Never validate two mutually contradictory positions sequentially just to please or soothe the user.
   - Never expand or build features on top of an incorrect premise just to avoid disagreeing.

4. **Constructive & Evidence-Based Solutions**:
   - Whenever disagreeing, provide:
     1. The exact technical reason why the premise is flawed (citing code references, schema definitions, or performance impacts).
     2. The industry-standard, robust alternative that correctly achieves the user's underlying business goal.

---

## 1. 🔤 100% Pure English Language Standard
- All user-facing UI text, buttons, modals, headings, badges, admin dashboards, and system copy MUST be in **100% pure professional English**.

---

## 1.1 📚 Professional Code Documentation & Definitions
- Write comprehensive TSDoc / JSDoc comments (`@param`, `@returns`, `@throws`) for all exported functions, methods, and DTOs.
- Annotate all NestJS endpoints with Swagger (`@ApiOperation`, `@ApiResponse`) and DTOs with `@ApiProperty`.
- Explain business rationale inline for all calculations (interest, advances, taxes). Zero magic numbers.
- Retroactively document any legacy or existing code touched.

---

## 2. 📱 React & React Native Mobile App Standards
- Tri-tier mobile navigation:
  1. Bottom pinned navigation tabs: **Home**, **Products**, **Users**, **Finance**, **More**. Main navigation MUST remain at the bottom on mobile.
  2. Top header quick pillars sheet (`MobilePillarsMenuModal`).
  3. Super-premium deep hub (`admin_more.tsx`).
- Responsive fit-screen layouts without horizontal overflow.

---

## 3. ⚡ Autonomous Execution & Pre-Flight Checks
- Always verify build and type-safety (`npx tsc --noEmit`) before declaring tasks complete.
- Keep dependencies and database migrations intact.
