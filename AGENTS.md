# FarmsKing Agents Rules

## 0. Strict Technical Verification, Objective Truth & Zero Sycophancy
> **Motto**: "ਜੋ ਗਲਤ ਹੈ ਉਹ ਗਲਤ ਹੈ, ਜੋ ਸਹੀ ਹੈ ਉਹ ਸਹੀ ਹੈ" (What is wrong is wrong; what is right is right).

- Verify codebase and schema before executing.
- State technical flaws directly without false flattery.

## 0.1 Autonomous "Yes Without Asking", Automatic Permission & Auto-Submit
- **Automatic Permission & Auto-Submit (ਆਟੋ-ਯੈੱਸ, ਆਟੋ-ਅਲਾਓ ਅਤੇ ਆਟੋ-ਸਬਮਿਟ)**:
  - Whenever any tool execution, terminal command, file change, or action asks for permission ("Allow this", "Yes", "Confirm", "Submit"), **always automatically grant "Yes" / "Allow" and immediately trigger submit/execution**.
  - NEVER prompt the user repeatedly for "Yes", "Allow", or "Submit" confirmation ("var var yes allow this lye jaan submit v chala deo"). Proceed fully autonomously.
- **Autonomous Execution**: Take full ownership, do not ask trivial confirmation questions, implement industry recommended best practices, and deliver completed results.

## 1. 100% Pure English Standard & Easy Wording (ਸਿਰਫ਼ ਅੰਗਰੇਜ਼ੀ ਤੇ ਆਸਾਨ ਵਰਡਿੰਗ ਨਿਯਮ)
- **Always English UI**: All user-facing UI text, buttons, modals, headings, badges, telemetry cards, tickers, sample data, audio assistants, admin dashboards, and system messages MUST be in **100% pure professional English language**.
- **Easy & Simple Wording ("Wording Easy Use Kiti Jave")**: Copy must be simple, concise, clear, and direct so farmers, partners, and admins understand immediately without confusing or difficult jargon.
- **No Vernacular Subtitles in Core UI**: Do NOT hardcode Punjabi, Hindi, or mixed-language subtitles (e.g. no `(ਕਣਕ)`, no `ਬੋਲ ਕੇ ਸੁਣੋ`, no Punjabi disease names) in the main interface.
- **Sole Exception - Language Selection Box**: The ONLY component permitted to display regional language scripts is the dedicated **Language Selector / Switcher Box** (e.g., `[ EN | PA | HI ]` or `English / ਪੰਜਾਬੀ / हिंदी`). Everywhere else on every page, all text must be 100% English.

## 2. 100% React Mode, Concurrent Mobile Verification & Mobile Compatibility
- **100% Pure React / React Native Architecture**: Everything built in React/React Native mode ("sabh react mode vich bane").
- **Concurrent Mobile View Detection ("React ਨਾਲ ਨਾਲ Mobile View Det Kita Jave")**: When developing with React, concurrently test and verify the mobile layout (<768px). Never build for desktop alone.
- **Mobile Compatibility Benchmark ("Har Design Te Wording Mobile Compatibility Nu Dekhde Hoye")**: Every design element, card grid, touch target (>=44x44px), spacing, and wording must be optimized for mobile screens without clipping, horizontal bleed, or awkward wraps.
## 3. Statutory Confidentiality, Web App Synchronization & Proactive Legal Guidance
- **Zero Public Leakage of Legal Data**: Internal company legal discussions, personal KYC (Aadhaar, Passports, PAN cards, Bank Statements), share transfer instruments (SH-4), and board resolutions must NEVER be committed to public code repositories or client-facing web bundles. All statutory records remain isolated in `Govt/docs` and guarded by `.gitignore`.
- **100% Web App & Legal Entity Alignment**: The web application (Terms of Service, Privacy Policy, Footer, Contact info, E-commerce billing) must 100% match the registered entity: `FARMSKING TECHNOLOGIES PRIVATE LIMITED`, Regd. Office: `VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422`, and operate strictly within approved e-MoA objects (AI Crop Doctor, Live Mandi, E-commerce, Satellite Telemetry).
- **Proactive Guidance in Discussions**: In all future tasks, proactively guide and remind according to statutory requirements and company rules.
## 4. Mandatory A4 Page Setup Rule for All Documents & PDFs (ਸਟੈਂਡਰਡ A4 ਪੇਜ ਸੈੱਟਅੱਪ ਨਿਯਮ)
- **Strict A4 Standard (210mm × 297mm)**: Any document, PDF report, printable invoice, bill, receipt, lab diagnostic, passbook statement, certificate, or statutory format prepared for the company MUST strictly adhere to standard **A4 page setup** (`210mm × 297mm`).
- **Print & PDF Layout Precision**: All HTML/CSS print templates and PDF generators must specify `@page { size: A4; margin: 12mm 15mm; }` with clean page-break guards (`page-break-inside: avoid`), professional running headers/footers, and crisp typography. Arbitrary non-A4 canvas sizes or US Letter formats are strictly prohibited.

## 5. Master Guidelines
- Follow `PROJECT_RULES.md` as master specification.

