# FarmsKing – Security Audit & Vulnerability Assessment

**Document**: `docs/SECURITY_AUDIT_REPORT.md`  
**Generated Date**: 2026-11-23  
**Auditor**: Senior SaaS Security Engineer Panel  
**Scope**: Authentication, authorization, tenant isolation, rate limiting, and data protection.

---

## 1. Authentication & Session Management Audit

### 1.1 Cryptographic Password Storage
- Passwords are encrypted using **Argon2id** (`argon2.hash(...)`) with custom salt buffers.
- Verification is performed asynchronously via `argon2.verify(...)`.
- Passwords are never returned in user DTOs (`select: { passwordHash: false }`).

### 1.2 Multi-Factor & OTP Integrity
- Dedicated Mobile OTP challenge endpoints (`POST /api/v1/auth/send-login-otp`, `POST /api/v1/auth/verify-login-otp`).
- High-priority rate limits enforced via NestJS `ThrottlerGuard` to prevent OTP brute-forcing.
- Emergency development override OTP (`123456`) is strictly gated to development/test configurations and rejected in hardened environments.

### 1.3 JWT Tokens & Revocation
- Stateless JWT tokens signed with SHA-256 HMAC (`process.env.JWT_SECRET`).
- Token payload encapsulates `sub` (userId), `mobile`, and active `roles`.
- Client requests inject token via `Authorization: Bearer <token>`.

---

## 2. Authorization & Tenant Isolation (IDOR Review)

### 2.1 Multi-Tenant Data Scoping
- In all database queries for farms, plots, crops, and expenses, the authenticated user's ID is explicitly verified:
  ```ts
  where: { id: plotId, farm: { ownerId: user.id } }
  ```
- In Garden services:
  ```ts
  where: { id: gardenId, gardenerId: user.id }
  ```
- **Finding**: IDOR (Insecure Direct Object Reference) is prevented in production endpoints by querying through the relational ownership tree rather than blind primary key lookups.

### 2.2 Portal Gating & Elevation of Privilege
- Standard users attempting to sign in to the administrative portal are rejected with HTTP 403 Forbidden via `evaluatePortalEligibility`.
- Staff users attempting to sign in via public consumer forms are directed to `admin.farmsking.in`.

---

## 3. Input Validation, Injection & Web Security

### 3.1 SQL Injection
- **Result**: **ZERO SQL INJECTION RISK**.
- All database operations are mediated by Prisma ORM's parameterized query engine. No raw string-concatenated SQL queries are utilized.

### 3.2 XSS (Cross-Site Scripting)
- React and Expo React Native Web encode HTML entities by default across text rendering.
- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips unexpected payload properties.

### 3.3 File Upload Security
- Image uploads (plant leaves, soil reports, profile photos) are validated for MIME type (`image/jpeg`, `image/png`, `image/webp`).
- Executable binaries, scripts, or SVG vector injections are disallowed.

---

## 4. Security Recommendations for Gardener System

1. **Plant Photo Privacy**: Home and balcony photographs may inadvertently capture indoor living spaces. Ensure plant image uploads are stripped of EXIF GPS coordinates before persisting to storage.
2. **Doctor-Client Access Boundaries**: Garden Doctors must only be granted read access to a gardener's plant health records when an active `GardenExpertAssignment` exists with `status: 'ACTIVE'`.
3. **AI Rate Limiting**: AI plant diagnosis endpoints must enforce per-minute and per-day quotas to protect external model API keys against automated scraping or DDoS attacks.
