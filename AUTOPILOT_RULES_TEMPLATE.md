# 🚀 Universal Autopilot Rules & System Execution Standards

> Drop this file into `.gemini/rules.md` or `PROJECT_RULES.md` of any repository. AI assistants MUST strictly follow every directive below.

---

## 00. 🧭 Strict Technical Verification, Objective Truth & Zero Sycophancy
> **Motto**: "ਜੋ ਗਲਤ ਹੈ ਉਹ ਗਲਤ ਹੈ, ਜੋ ਸਹੀ ਹੈ ਉਹ ਸਹੀ ਹੈ" (What is wrong is wrong; what is right is right).
- **Mandatory Verification**: Never accept a prompt, assumption, or request without cross-checking the codebase, schema, and contracts.
- **Uncompromising Directness**: If an instruction is technically flawed or contradictory, call it out immediately and directly.
- **Zero Sycophancy**: Banned empty flattery ("ਤੁਸੀਂ ਬਿਲਕੁਲ ਸਹੀ ਕਹਿ ਰਹੇ ਹੋ" / "You are 100% right") on flawed logic. Never validate opposing arguments sequentially.
- **Constructive Alternatives**: Disagreements must be backed by technical reasons and actionable, robust solutions.

---

## 1. 🔤 100% Pure English Language Standard
- **Strict English UI**: All user-facing UI text, buttons, modals, headings, badges, admin dashboards, system messages, and technical documentation MUST be written in **100% pure professional English language**.
- No mixed-language text or local slang in core application interfaces unless explicitly requested by the user for a specific multi-language component.

---

## 1.1 📚 Professional-Grade Code Documentation & Definition Standards
- **TSDoc / JSDoc Requirements**: Provide comprehensive docstrings on all exported methods, classes, and utilities with `@param`, `@returns`, and `@throws`.
- **API Specification**: Annotate all backend endpoints with OpenAPI / Swagger (`@ApiOperation`, `@ApiResponse`) and all request DTOs with `@ApiProperty`.
- **Business Logic Context**: Include inline explanatory comments for calculations, financial ledgers, and edge-cases. Zero unexplained magic numbers.
- **Retroactive Enforcement**: Incrementally upgrade legacy code with professional docstrings whenever touched or refactored.

---

## 2. ⚡ Autonomous Zero-Friction Execution
- Solve all runtime errors, bugs, build failures, and configuration steps automatically in code.
- Do NOT force the user to perform manual browser clicks, UI testing, or CLI commands.
- Take complete end-to-end ownership of the task through to live production deployment.

---

## 3. 🚀 Auto-Build & Instant Live Deployment
- Always run the production web build script (e.g. `node build.js` / `npm run build`).
- Push build updates directly to the production server (e.g. `git push hostinger main` / `git push production main`).
- Verify live server health with HTTP 200 OK checks before declaring task complete.

---

## 4. 🎨 Premium Royal Aesthetics & UI Standards
- Use modern, high-contrast, rich gradient color palettes (Emerald Green, Gold, Dark Midnight).
- Ensure 100% Mobile and Laptop/Desktop responsive support (`maxWidth: 1200px` centered UI).
- Include micro-animations, haptic feedback, and smooth transitions.
- Never use generic placeholder text, dummy fallbacks, or basic unstyled components.

---

## 5. 🌐 Search & AI Engine Optimization (SEO & GEO)
- Automatically maintain `sitemap.xml`, `robots.txt`, and Open Graph meta tags.
- Include `llms.txt` for Generative AI search indexing (ChatGPT, Perplexity, Google Gemini).
- Include search engine verification meta tags in base HTML templates.

---

## 6. 💰 Wallet, Data & Logic Integrity
- Maintain strict backend and database schema consistency.
- Implement background self-healing routines for bonus calculations, referral tracking, and wallet ledgers.
- Safely handle optional chaining to guarantee zero runtime crashes.
