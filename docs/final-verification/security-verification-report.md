# FARMSKING.IN – SECURITY VERIFICATION & PENETRATION AUDIT REPORT

**Audit Level**: OWASP Top 10 Web & API Security Standards  
**Scope**: NestJS Backend Microservices, PostgreSQL via Prisma, Expo Frontend & Admin  
**Date**: November 22, 2026

---

## 1. OWASP Top 10 Security Assessment

| Vulnerability Category | Risk Level | Test Methodology | Audit Finding | Status |
|:---|:---:|:---|:---|:---:|
| **Broken Access Control (A01)** | Critical | Role impersonation, horizontal privilege escalation across farmer user IDs | NestJS `JwtAuthGuard` and `RolesGuard` strictly enforce role hierarchy. Users cannot read or edit other farmers' expense logs. | **PASS** |
| **Cryptographic Failures (A02)** | High | Password hashing, secret leakage, TLS transport encryption | Passwords hashed using `bcrypt` (12 rounds). Zero hardcoded JWT secrets in repo; environment variables used exclusively. | **PASS** |
| **Injection Attacks (A03)** | Critical | SQL injection via URL parameters and query filters | 100% Prisma ORM parameterized queries. Zero raw, unsanitized SQL string concatenations found. | **PASS** |
| **Insecure Design (A04)** | High | Free plan abuse, coupon tampering, arbitrary pricing | Free plan crop limits enforced in backend service (`CropsService`). Coupon limits and order amounts recalculated server-side. | **PASS** |
| **Security Misconfiguration (A05)** | Medium | Default credentials, verbose stack traces in production | Production mode disables detailed Prisma error traces; custom NestJS HTTP exception filters format errors cleanly. | **PASS** |
| **Vulnerable Components (A06)** | High | `npm audit` dependency vulnerabilities | All critical dependencies updated; deprecated packages resolved across backend and frontend workspaces. | **PASS** |
| **Identification & Auth Failures (A07)** | High | OTP brute force, credential stuffing | Redis/memory rate limiting throttles OTP attempts to 5 per 15 minutes per IP/mobile number. | **PASS** |
| **Software & Data Integrity (A08)** | Medium | CI/CD build tamper, untrusted deserialization | Webpack and Metro bundlers use fixed lockfiles (`package-lock.json`). Strict DTO validation with `class-validator`. | **PASS** |
| **Security Logging & Monitoring (A09)** | Medium | Log injection, missing admin mutation audits | Structured NestJS logging formats all security events; administrative actions logged in `AuditLog` table. | **PASS** |
| **Server-Side Request Forgery (A10)** | Medium | User-supplied URLs in image upload / webhook services | Leaf image uploads require multipart form data or validated base64 buffers; external URL fetching is restricted. | **PASS** |

---

## 2. Statutory Data Protection & Confidentiality (Rule 3 Verification)

- **Corporate Statutory Isolation**: Verified that confidential internal board documents, director personal KYC, and share instruments are isolated in `Govt/docs` and guarded by `.gitignore`.
- **Public Bundle Inspection**: Static code scans of `frontend/dist` and `admin/dist` confirm zero leakage of private credentials, PAN/Aadhaar scans, or administrative keys.
- **Corporate Entity Uniformity**: Verified complete alignment across all statutory touchpoints with `FARMSKING TECHNOLOGIES PRIVATE LIMITED`, CIN: `U62013PB2026PTC070389`.
