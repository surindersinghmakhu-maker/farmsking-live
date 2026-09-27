# 🌾 FarmsKing Technical Trainer System - Admin Architecture & Operational Guide

## 📌 Executive Overview
FarmsKing Technical Trainer System is a state & district level farmer onboarding, app guidance, and technical support hierarchy. It ensures that every newly registered farmer gets direct phone & WhatsApp training assistance from a designated Technical Trainer.

---

## 🏗️ 1. Technical Architecture & Data Storage (ਕਿਥੇ ਕੀ ਸੇਵ ਹੈ)

### 🗄️ Backend Database Schema (`backend/prisma/schema.prisma`)
1. **User Role**: `TECHNICAL_TRAINER` added to `Role` enum.
2. **`TrainerAssignment` Model**:
   - `trainerId`: Linked to trainer's `User` record.
   - `level`: `BASELINE` (Level 1 Part-time) or `UPLINE` (Level 2 Senior).
   - `grade`: `GRADE_A` (4.5-5.0★), `GRADE_B` (3.5-4.4★), `GRADE_C` (<3.5★).
   - `state` & `district`: Geographic assignment zone.
   - `isAvailable`, `availableFrom`, `availableTo`, `shiftType`: Duty status & available call windows.
   - `commissionRate`: Custom wallet reward setting per trainer.
3. **`FarmerTrainingLog` Model**:
   - `farmerId`: Unique farmer assigned.
   - `trainerId`: Baseline Technical Trainer assigned.
   - `isCallRequested`, `preferredCallSlot`: Farmer's 1-tap call request data (`MORNING_9_12`, `AFTERNOON_12_4`, `EVENING_4_7`, `ANYTIME`).
   - `isForwarded`, `forwardedToId`, `forwardReason`: Baseline to Upline escalation record.
   - `status`: `PENDING_CALL`, `IN_PROGRESS`, `WAITING_VERIFICATION`, `VERIFIED_AND_PAID`, `UNREACHABLE`.
   - `rating`: 1 to 5 Star Rating given by Farmer.
   - `payoutAmount` & `payoutTxId`: Instant FarmsKing Wallet Credit transaction ID.

---

## ⚡ 2. Backend Modules & API Endpoints

### 📁 Files:
- `backend/src/modules/trainers/trainers.module.ts`
- `backend/src/modules/trainers/trainers.service.ts`
- `backend/src/modules/trainers/trainers.controller.ts`

### 🔌 Key API Endpoints:
1. `GET /api/v1/trainers/my-assigned-farmers` -> Technical Trainer fetches assigned farmers list.
2. `POST /api/v1/trainers/request-call` -> Farmer requests 1-tap callback with preferred time slot.
3. `POST /api/v1/trainers/farmer-verify` -> Farmer submits 1-5★ Star Rating & releases wallet reward to trainer.
4. `POST /api/v1/trainers/forward-upline` -> Baseline Trainer escalates complex issue to Upline Senior.
5. `POST /api/v1/trainers/update-availability` -> Trainer toggles Online/Offline or shift hours.
6. `POST /api/v1/trainers/assignments` -> Admin assigns trainer to state/district using King ID.
7. `GET /api/v1/trainers/admin-reports` -> Admin live accountability dashboard & call logs.

---

## 📱 3. Frontend Mobile & Web App Screens

### 📁 Files:
- `frontend/app/(tabs)/trainer-dashboard.tsx` -> Trainer Mobile Dashboard with Call, WhatsApp, and Forward buttons.
- `frontend/src/components/FarmerTrainingRatingBanner.tsx` -> Farmer 1-to-5 Star Rating & Feedback Banner on Farmer Home Screen.
- `frontend/src/api/trainers.api.ts` -> Frontend API client functions.

---

## 💰 4. 3-Tier Reward & Wallet System Rules

| Star Rating | Trainer Wallet Reward | Performance Grade Impact |
| :--- | :--- | :--- |
| **5★ (ਸ਼ਾਨਦਾਰ)** | **₹25 Credited Instant** | Grade A (Top Trainer - Upline Eligible) |
| **4★ (ਚੰਗਾ)** | **₹15 Credited Instant** | Grade B (Regular Trainer) |
| **1-3★ (ਮਾੜਾ)** | **₹0 Credited** | Grade C (Needs Improvement / Warning) |

---

## 🔄 5. Complete Step-by-Step Workflow (ਕਿਵੇਂ ਚੱਲੇਗਾ)

1. **Farmer Registration:** When a new farmer registers in Punjab/Haryana/etc., the backend automatically checks `TrainerAssignment` for their State/District and assigns them to the Baseline Technical Trainer.
2. **Trainer Notification & Dashboard:** The assigned Baseline Trainer sees the new farmer in their Trainer Dashboard with 1-click `📞 Call` and `💬 WhatsApp Welcome` options.
3. **Farmer Call Request:** If farmer needs assistance, they tap **`📞 ਮੈਨੂੰ ਟ੍ਰੇਨਰ ਦੀ ਕਾਲ ਚਾਹੀਦੀ ਹੈ`** on their home screen. Trainer gets an immediate WhatsApp notification.
4. **Escalation (Forwarding):** If Baseline Trainer faces a complex technical/UPI problem, they click **`⏩ Forward to Upline`**, sending the case to the State Upline Senior Trainer.
5. **Rating & Wallet Payout:** Once training is done, farmer rates 4★ or 5★ on their app screen. The exact reward (₹15 or ₹25) is instantly transferred to the Technical Trainer's FarmsKing Wallet!
