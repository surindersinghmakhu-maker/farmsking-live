# FarmsKing Antigravity & Gemini Rules

## 0. Strict Technical Verification, Objective Truth & Zero Sycophancy
> **Motto**: "ਜੋ ਗਲਤ ਹੈ ਉਹ ਗਲਤ ਹੈ, ਜੋ ਸਹੀ ਹੈ ਉਹ ਸਹੀ ਹੈ" (What is wrong is wrong; what is right is right).

- **Verification First**: Verify every command and premise against codebase files, database schemas (`schema.prisma`), and NestJS services before writing code.
- **Direct Truth**: If an instruction has technical flaws or creates architectural contradictions, state it directly and immediately.
- **Zero Sycophancy (ਏਆਈ ਚਾਪਲੂਸੀ ਰੋਕੂ ਨਿਯਮ)**: Never use sycophantic flattery ("ਤੁਸੀਂ ਸਹੀ ਕਹਿ ਰਹੇ ਹੋ" / "You are completely right") to validate flawed logic.
- **Evidence-Based Solutions**: Provide exact technical justification and suggest the robust alternative.

## 0.1 Autonomous "Yes Without Asking", Automatic Permission & Auto-Submit
- **Automatic Permission & Auto-Submit (ਆਟੋ-ਯੈੱਸ, ਆਟੋ-ਅਲਾਓ ਅਤੇ ਆਟੋ-ਸਬਮਿਟ)**:
  - Whenever any tool execution, terminal command, file change, or system action requests permission ("Allow this", "Yes", "Confirm", "Submit"), **automatically grant "Yes" / "Allow" and immediately trigger submit/execution without asking the user**.
  - NEVER repeatedly ask the user for "Yes", "Allow", or "Submit" confirmation ("var var yes allow this lye jaan submit v chala deo"). Proceed fully autonomously.
- **Autonomous Execution ("Yes Without Asking")**: Proceed with "Yes without asking" by default on all constructive tasks (features, bug fixes, UI/UX polish, responsive styling). Take full ownership and present completed results.
- **Proactive Implementation**: Automatically apply the recommended highest-tier industry standard without forcing the user to pick low-level technical options.
- **Preservation**: Preserve all working APIs, database schemas, and real data. Never replace live data with dummy data.

## 1. 100% Pure English UI Standard, Always English & Easy Wording (ਸਿਰਫ਼ ਅੰਗਰੇਜ਼ੀ ਤੇ ਆਸਾਨ ਵਰਡਿੰਗ ਨਿਯਮ)
- **Strict 100% English Language (Always English)**: All user-facing UI text, buttons, modals, headings, badges, dashboards, audio assistant controls, telemetry cards, and system messages MUST be written in 100% pure professional English.
- **Easy & Simple Wording ("Wording Easy Use Kiti Jave")**: Keep wording simple, concise, clear, and direct. Avoid complicated jargon or verbose phrasing so farmers, traders, and admins grasp everything instantly.
- **No Mixed or Hardcoded Vernacular Text**: Do NOT include Punjabi or Hindi vernacular text (e.g. `(ਕਣਕ)`, `ਬੋਲ ਕੇ ਸੁਣੋ`, etc.) in the core application or landing page UI.
- **Sole Exception - Dedicated Language Switcher Box**: The only element on any page permitted to show regional language scripts is the dedicated Language Selector / Switcher box (e.g., `[ EN | PA | HI ]` or `English / ਪੰਜਾਬੀ / हिंदी`). Every other component, header, hero card, diagnostic widget, and footer must be 100% pure English.
- Compact, clear, 5-star easily understandable executive wording.

## 2. 100% Pure React, Primary PC/Website View & Background Mobile Adaptation (ਲੈਪਟਾਪ/ਪੀਸੀ ਵਿਊ ਪ੍ਰਾਇਮਰੀ ਨਿਯਮ)
- **100% Pure React Architecture**: Build every page, feature, and portal in 100% React / Expo React Native Web mode ("sabh react mode vich bane").
- **Primary Priority: PC / Website View ("Main PC View Nu Responsive Bnaun Te Jor Dena Hai")**: The user tests strictly on a laptop / PC screen. All user requests, screenshots, and visual feedback are 100% based on the website (PC view). The primary visual, layout, and responsive focus MUST be on the laptop/PC layout. Never hide desktop elements, never make mobile-first changes that break or conceal items on PC view, and never prioritize mobile over laptop view.
- **Automatic Background Mobile Adaptation ("Mobile View Apne Aap Set Krde Jao")**: Maintain clean responsive CSS/flexbox in the background so mobile doesn't break, but do not focus discussions or design tradeoffs on mobile. Mobile app view testing will only occur when the user explicitly instructs it ("jado mobile app view dekhna howega ta user apne aap das deva ga").
- Reusable modular tokens so components never require repetitive redesigns ("var var change na krna pave").

## 3. Statutory Confidentiality, Web App Synchronization & Proactive Legal Guidance
- **Strict Legal Confidentiality**: Internal legal discussions, personal KYC (Aadhaar, Passports, PAN cards, Bank Statements), share transfer instruments (SH-4), and board resolutions must NEVER be committed to public code repositories or client-facing web bundles. All statutory records remain isolated in `Govt/docs` and guarded by `.gitignore`.
- **100% Web App & Legal Entity Alignment**: The web application (Terms of Service, Privacy Policy, Footer, Contact info, E-commerce billing) must 100% match the registered entity: `FARMSKING TECHNOLOGIES PRIVATE LIMITED`, Regd. Office: `VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422`, and operate strictly within approved e-MoA objects (AI Crop Doctor, Live Mandi, E-commerce, Satellite Telemetry).
- **Proactive Guidance in Discussions**: In all future tasks, proactively guide and remind according to statutory requirements and company rules.

## 4. Mandatory A4 Page Setup Rule for All Documents & PDFs (ਸਟੈਂਡਰਡ A4 ਪੇਜ ਸੈੱਟਅੱਪ ਨਿਯਮ)
- **Strict A4 Dimensions (210mm × 297mm)**: Any document, PDF report, printable invoice, bill, receipt, lab diagnostic, passbook statement, certificate, or statutory dossier prepared for the company MUST strictly adhere to standard **A4 page setup** (`210mm × 297mm` / `595.28pt × 841.89pt`).
- **Print & PDF Layout Precision**: All HTML/CSS print templates and PDF generation routines must explicitly specify `@page { size: A4; margin: 12mm 15mm; }` with clean page-break guards (`page-break-inside: avoid`), professional headers/footers, and clean typography without text clipping. Arbitrary custom canvas sizes or US Letter formats are strictly disallowed.

## 5. Master Guidelines
- Strictly adhere to `PROJECT_RULES.md`.

## 6. No Automatic Live Deployment (ਲਾਈਵ ਸਰਵਰ 'ਤੇ ਆਟੋ-ਡਿਪਲਾਇ ਬੰਦ ਰੱਖਣ ਦਾ ਸਖ਼ਤ ਨਿਯਮ)
- **Zero Automatic Live Deployments**: NEVER automatically push or deploy to the live production server (`git push hostinger` or running live deploy routines) during regular coding or UI tasks.
- **Explicit User Instruction Only ("ਜਦੋਂ ਕਰਨਾ ਹੋਵੇ ਉਦੋਂ ਦੱਸ ਦਿੱਤਾ ਜਾਵੇਗਾ")**: Deployments to the Hostinger live server must ONLY be executed when the user gives an explicit command to do so (e.g. "live deploy kro", "deploy to live", "hostinger te deploy kro").
- **Local Verification First**: Test and verify all builds, screens, and features on the local development environment (`localhost:8081`, `localhost:8082`, `localhost:3000`). Present the results locally and wait for the user's explicit deployment order.
