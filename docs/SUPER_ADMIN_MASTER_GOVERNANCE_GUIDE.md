# 👑 Super Admin Master Governance & Business Pitch Guide
> **ਫਾਰਮਜ਼ਕਿੰਗ ਪੂਰੇ ਪ੍ਰੋਜੈਕਟ ਦੀ ਮਾਸਟਰ ਗਾਈਡ, ਸਾਰੇ ਫੀਚਰਾਂ ਦੀ ਸੂਚੀ, ਕਮਾਈ ਦਾ ਮੋਡਲ ਅਤੇ ਪਲੈਨਿੰਗ ਗਾਈਡ**
> *Super Admin / Owner ਦੀ ਵਰਤੋਂ ਲਈ: ਪ੍ਰੋਜੈਕਟ ਨੂੰ ਸਮਝਣ, ਪਲੈਨਿੰਗ ਕਰਨ ਅਤੇ ਕਿਸਾਨਾਂ/ਪਾਰਟਨਰਾਂ ਨੂੰ ਪਲੈਨ ਦੇਣ ਲਈ।*

---

## 📑 ਸਮੱਗਰੀ (Table of Contents)

1. [ਪ੍ਰੋਜੈਕਟ ਦਾ ਮੁੱਖ ਮਨੋਰਥ (Platform Vision & Ecosystem)](#1-vision)
2. [ਯੂਨੀਵਰਸਲ ਕਿੰਗ ਆਈਡੀ ਸਿਸਟਮ (Universal King ID System: `FK-[6DIGITS]`)](#2-king-id)
3. [ਪਲੈਨ ਕੂਪਨ ਸਿਸਟਮ ਤੇ 100% ਐਡਮਿਨ ਆਮਦਨ ਨਿਯਮ (100% Admin Income Rule)](#3-admin-income)
4. [ਕੂਪਨ ਫਾਇਨਾਂਸ਼ੀਅਲ ਅਕਾਊਂਟਿੰਗ ਸਮਰੀ (Financial Accounting Summary Dashboard)](#4-financial-summary)
5. [ਆੜ੍ਹਤੀਆ ਮੈਨੇਜਮੈਂਟ ਮੋਡੀਊਲ (Arhtiya Module Architecture)](#5-arhtiya-architecture)
   - [ਆਟੋਮੈਟਿਕ ਮਹੀਨਾਵਾਰ ਵਿਆਜ ਕੈਲਕੂਲੇਟਰ](#51-interest)
   - [ਮੰਡੀ ਵਜ਼ਨ ਆਟੋ-ਕਨਵਰਟਰ (Bori/Mann to Quintal)](#52-converter)
   - [ਡਿਜੀਟਲ ਜੇ-ਫਾਰਮ ਵਾਲਟ (J-Form Vault)](#53-jform)
6. [ਕਸਟਮਰ ਰੈਫਰਲ ਤੇ 2-Tier ਵਾਲਿਟ ਰੋਇਲਟੀ (Customer Referrals & Royalties)](#6-referral-royalties)
7. [20-ਰੈਫਰਲ ਫ੍ਰੀ ਐਡਮਿਨ ਕੂਪਨ ਇਨਾਮ Engine (Milestone Reward Engine)](#7-milestone-engine)
8. [ਸਾਰੇ ਯੂਜ਼ਰ ਰੋਲਜ਼ ਅਤੇ ਸਬ-ਗਾਈਡਜ਼ ਦੀ ਪੂਰੀ ਸੂਚੀ (User Roles & Sub-Guides Matrix)](#8-matrix)

---

<a name="1-vision"></a>
## 1. ਪ੍ਰੋਜੈਕਟ ਦਾ ਮੁੱਖ ਮਨੋਰਥ (Platform Vision & Ecosystem)
ਫਾਰਮਜ਼ਕਿੰਗ (FarmsKing) ਭਾਰਤੀ ਕਿਸਾਨਾਂ, ਆੜ੍ਹਤੀਆਂ, ਖੇਤੀਬਾੜੀ ਸਲਾਹਕਾਰਾਂ (Advisors) ਅਤੇ ਬਿਜ਼ਨਸ ਪਾਰਟਨਰਾਂ (Partners) ਨੂੰ ਇੱਕੋ ਛੱਤ ਹੇਠ ਜੋੜਨ ਵਾਲਾ ਇੱਕ ਸੰਪੂਰਨ ਡਿਜੀਟਲ ਪਲੇਟਫਾਰਮ ਹੈ।

---

<a name="2-king-id"></a>
## 2. ਯੂਨੀਵਰਸਲ ਕਿੰਗ ਆਈਡੀ ਸਿਸਟਮ (Universal King ID System: `FK-[6DIGITS]`)
- **ਸਭ ਲਈ ਇੱਕੋ ਯੂਨੀਫਾਰਮ ਨੰਬਰ**: ਹਰ ਕਿਸਾਨ, ਆੜ੍ਹਤੀਆ, ਸਪਲਾਇਰ, ਮਜ਼ਦੂਰ, ਸਲਾਹਕਾਰ ਅਤੇ ਪਾਰਟਨਰ ਇੱਕ 6-ਅੱਖਰੀ **King ID** (ਜਿਵੇਂ `FK-100238`) ਨਾਲ ਪਛਾਣਿਆ ਜਾਂਦਾ ਹੈ।
- **ਪ੍ਰਾਈਵੇਟ ਪ੍ਰਾਈਵੇਸੀ ਸੁਰੱਖਿਆ (`ownerFarmerId`)**: ਕਿਸਾਨ ਦੁਆਰਾ ਜੋੜੇ ਗਏ ਲੋਕਲ ਮਜ਼ਦੂਰ ਜਾਂ ਆੜ੍ਹਤੀਏ ਸਿਰਫ਼ ਉਸੇ ਕਿਸਾਨ ਦੀ ਐਪ ਵਿੱਚ ਦਿਖਾਈ ਦਿੰਦੇ ਹਨ।

---

<a name="3-admin-income"></a>
## 3. ਪਲੈਨ ਕੂਪਨ ਸਿਸਟਮ ਤੇ 100% ਐਡਮਿਨ ਆਮਦਨ ਨਿਯਮ (100% Admin Income Rule)
- **Super Admin Coupons**: ਸੁਪਰ ਐਡਮਿਨ ਕਿਸੇ ਵੀ ਕਿਸਮ ਦਾ ਕੂਪਨ (LITE, PRO, ADVISOR) ਜਨਰੇਟ ਕਰ ਸਕਦਾ ਹੈ।
- **100% Admin Revenue Rule**: ਸੁਪਰ ਐਡਮਿਨ ਦੁਆਰਾ ਜਨਰੇਟ ਕੀਤੇ ਕੂਪਨ ਰਿਡੀਮ ਹੋਣ 'ਤੇ **₹0 ਕਮਿਸ਼ਨ** ਪਾਰਟਨਰ ਨੂੰ ਜਾਂਦੀ ਹੈ। 100% ਰਕਮ ਐਡਮਿਨ ਦੇ ਖਾਤੇ ਵਿੱਚ ਰਹਿੰਦੀ ਹੈ।

---

<a name="4-financial-summary"></a>
## 4. ਕੂਪਨ ਫਾਇਨਾਂਸ਼ੀਅਲ ਅਕਾਊਂਟਿੰਗ ਸਮਰੀ (`/farmer-plans/financial-summary`)
ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਰੀਅਲ-ਟਾਈਮ ਹਿਸਾਬ ਬੋਰਡ:
- **Grand Total Coupon Income**: ਸਾਰੇ ਕੂਪਨ ਸਟ੍ਰੀਮਜ਼ ਦੀ ਕੁੱਲ ਆਮਦਨ।
- **Direct Admin Income (100%)**: ਐਡਮਿਨ ਦੁਆਰਾ ਵਰਤੇ ਗਏ ਕੂਪਨਾਂ ਦੀ ਸਿੱਧੀ ਆਮਦਨ।
- **Partner Payments Collected**: ਬਿਜ਼ਨਸ ਪਾਰਟਨਰਾਂ ਤੋਂ ਅੱਪਫ੍ਰੰਟ ਇਕੱਠੀ ਹੋਈ ਰਕਮ।
- **Advisor Platform Fees**: ਸਲਾਹਕਾਰਾਂ ਤੋਂ ਇਕੱਠੀ ਹੋਈ ਪਲੇਟਫਾਰਮ ਫੀਸ।

---

<a name="5-arhtiya-architecture"></a>
## 5. ਆੜ੍ਹਤੀਆ ਮੈਨੇਜਮੈਂਟ ਮੋਡੀਊਲ (Arhtiya Module Architecture)

<a name="51-interest"></a>
### 5.1 ਆਟੋਮੈਟਿਕ ਮਹੀਨਾਵਾਰ ਵਿਆਜ ਕੈਲਕੂਲੇਟਰ
- ਆੜ੍ਹਤੀਏ ਤੋਂ ਲਏ ਨਕਦ ਐਡਵਾਂਸ 'ਤੇ ਮਹੀਨਾਵਾਰ ਵਿਆਜ % (ਜਿਵੇਂ 1.5%) ਦਰਜ ਹੁੰਦਾ ਹੈ। ਐਪ ਤਾਰੀਖ ਤੋਂ ਅੱਜ ਤੱਕ ਦੇ ਦਿਨ ਗਿਣ ਕੇ ਆਪੇ ਬਣਦਾ ਵਿਆਜ ਕੈਲਕੂਲੇਟ ਕਰਦੀ ਹੈ:
  $$\text{Interest Amount} = \text{Principal} \times \left(\frac{\text{Monthly Rate}}{100}\right) \times \left(\frac{\text{Days Elapsed}}{30}\right)$$

<a name="52-converter"></a>
### 5.2 ਮੰਡੀ ਵਜ਼ਨ ਆਟੋ-ਕਨਵਰਟਰ (Bori/Mann to Quintal)
- ਬੋਰੀ 50kg, ਬੋਰੀ 35kg, ਮਣ (40kg) ਨੂੰ ਆਟੋਮੈਟਿਕ **ਕੁਇੰਟਲਾਂ** ਵਿੱਚ ਬਦਲ ਕੇ ਰੇਟ ਅਤੇ 2.5% ਆੜ੍ਹਤ ਕਮਿਸ਼ਨ ਕੈਲਕੂਲੇਟ ਕਰਦਾ ਹੈ।

<a name="53-jform"></a>
### 5.3 ਡਿਜੀਟਲ ਜੇ-ਫਾਰਮ ਵਾਲਟ (J-Form Vault)
- J-Form ਨੰਬਰ, ਤਾਰੀਖ ਅਤੇ ਫੋਟੋ URL ਸਟੋਰ ਕਰਨ ਦਾ ਡਿਜੀਟਲ ਸਿਸਟਮ।

---

<a name="6-referral-royalties"></a>
## 6. ਕਸਟਮਰ ਰੈਫਰਲ ਤੇ 2-Tier ਵਾਲਿਟ ਰੋਇਲਟੀ (Customer Referrals & Royalties)
- **1-Click WhatsApp Invite**: `farmsking.com/invite?ref=FK-100238` ਲਿੰਕ ਨਾਲ ਆਟੋ-ਲਿੰਕ।
- **ਵੱਖ-ਵੱਖ ਰੋਇਲਟੀ ਦਰਾਂ**:
  - **Plan Purchases / Renewals**: **1.0%** (Tier 1 Direct) / **0.5%** (Tier 2 Extended).
  - **Store Shopping Purchases**: **0.01%** (Tier 1 Direct) / **0.005%** (Tier 2 Extended).

---

<a name="7-milestone-engine"></a>
## 7. 20-ਰੈਫਰਲ ਫ੍ਰੀ ਐਡਮਿਨ ਕੂਪਨ ਇਨਾਮ Engine (Milestone Reward Engine)
- ਜਦੋਂ ਵੀ ਕੋਈ ਕਿਸਾਨ/ਯੂਜ਼ਰ **20 direct referrals** ਪੂਰੇ ਕਰਦਾ ਹੈ, ਸਿਸਟਮ **1 ਫ੍ਰੀ ਐਡਮਿਨ ਪਲੈਨ ਕੂਪਨ (`KC-LITE` / `KC-PRO`)** ਜਨਰੇਟ ਕਰਕੇ ਉਸਦੇ ਅਕਾਊਂਟ ਵਾਲਿਟ ਵਿੱਚ ਆਟੋਮੈਟਿਕ ਜਮ੍ਹਾਂ ਕਰ ਦੇਂਦਾ ਹੈ।

---

<a name="8-matrix"></a>
## 8. ਸਾਰੇ ਯੂਜ਼ਰ ਰੋੋਲਜ਼ ਅਤੇ ਸਬ-ਗਾਈਡਜ਼ ਦੀ ਪੂਰੀ ਸੂਚੀ (User Roles & Sub-Guides Matrix)

| User Role / Topic | Dedicated Sub-Guide Link | Key Capabilities Covered |
| :--- | :--- | :--- |
| **🌾 Farmer Role Guide** | [FARMER_USER_GUIDE.md](file:///d:/FarmsKing/docs/FARMER_USER_GUIDE.md) | Farm setup, Arhtiya advance, auto-interest, mandi converter, J-Form vault, coupons. |
| **👨‍🌾 Advisor Role Guide** | [ADVISOR_USER_GUIDE.md](file:///d:/FarmsKing/docs/ADVISOR_USER_GUIDE.md) | Advisor plan coupons, active wallet credit on redemption, direct farmer activation. |
| **🏢 Business Partner Guide** | [BUSINESS_PARTNER_GUIDE.md](file:///d:/FarmsKing/docs/BUSINESS_PARTNER_GUIDE.md) | Partner coupons, upfront wallet debits, direct farmer assignments, ledger history. |
| **🎁 Plan Coupons & How to Get**| [PLAN_COUPONS_AND_HOW_TO_GET.md](file:///d:/FarmsKing/docs/PLAN_COUPONS_AND_HOW_TO_GET.md) | Plan tiers, coupon formats, 4 ways to get coupons, redemption instructions. |
| **👑 Super Admin Master Manual** | [SUPER_ADMIN_MASTER_GOVERNANCE_GUIDE.md](file:///d:/FarmsKing/docs/SUPER_ADMIN_MASTER_GOVERNANCE_GUIDE.md) | Master system governance, 100% Admin income rule, financial summary dashboard, full architecture. |

---

---

<a name="9-gdrive-backup"></a>
## 9. ਗੂਗਲ ਡਰਾਈਵ ਡਾਟਾਬੇਸ ਬੈਕਅੱਪ ਸਿਸਟਮ (Google Drive Database Backup Architecture)
- **ਮੈਨੂਅਲ ਬੈਕਅੱਪ (Manual Backup Trigger)**: ਸੁਪਰ ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ **"Backup Now to Google Drive"** ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਤੁਰੰਤ ਡਾਟਾਬੇਸ ਦੀ ਸਾਰੇ ਟੇਬਲਾਂ ਵਾਲੀ `.sql.gz` ਫਾਈਲ ਗੂਗਲ ਡਰਾਈਵ 'ਤੇ ਅੱਪਲੋਡ ਕਰ ਸਕਦਾ ਹੈ।
- **ਹਫ਼ਤਾਵਾਰ ਆਟੋਮੈਟਿਕ ਬੈਕਅੱਪ (Weekly Auto Backup Cron)**: ਹਰ ਐਤਵਾਰ ਰਾਤ 2:00 ਵਜੇ ਸਿਸਟਮ ਆਪਣੇ ਆਪ ਪੂਰੇ ਡਾਟਾਬੇਸ ਦਾ ਬੈਕਅੱਪ ਲੈ ਕੇ ਗੂਗਲ ਡਰਾਈਵ ਦੇ ਨਿਰਧਾਰਿਤ ਫੋਲਡਰ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਸਟੋਰ ਕਰ ਦੇਂਦਾ ਹੈ।
- **ਬੈਕਅੱਪ ਆਡਿਟ ਹਿਸਟਰੀ**: `DatabaseBackupLog` ਟੇਬਲ ਵਿੱਚ ਹਰੇਕ ਬੈਕਅੱਪ ਦੀ ਤਾਰੀਖ, ਫਾਈਲ ਸਾਈਜ਼ ਅਤੇ ਗੂਗਲ ਡਰਾਈਵ ਲਿੰਕ ਦਾ ਪੂਰਾ ਆਡਿਟ ਸਟੋਰ ਹੁੰਦਾ ਹੈ।

---

<a name="10-growth-strategy"></a>
## 10. ⚡ 6 Industry-Disrupting, Mind-Blowing Features (ਮਨ ਨੂੰ ਹਿਲਾ ਦੇਣ ਵਾਲੇ 6 ਵੱਡੇ ਫੀਚਰਜ਼)
1. **🎙️ Voice-Activated Punjabi AI Assistant (ਬੋਲ ਕੇ ਹਿਸਾਬ ਤੇ ਸਲਾਹ)**: ਟਾਈਪ ਕਰਨ ਦੀ ਬਿਲਕੁਲ ਲੋੜ ਨਹੀਂ! ਕਿਸਾਨ ਆਪਣੀ ਆਵਾਜ਼ ਵਿੱਚ ਪੰਜਾਬੀ ਬੋਲੇਗਾ: *"ਅੱਜ ਮੈਂ 2 ਬੋਰੀ ਡੀ.ਏ.ਪੀ 2700 ਦੀ ਖਰੀਦੀ ਹੈ, ਸ਼ਰਮਾ ਆੜ੍ਹਤੀਏ ਦੇ ਖਾਤੇ ਪਾ ਦੇ"* $\rightarrow$ AI ਆਵਾਜ਼ ਸੁਣ ਕੇ ਆਪੇ ਹਿਸਾਬ ਸੇਵ ਕਰੇਗਾ ਅਤੇ ਪੰਜਾਬੀ ਬੋਲ ਕੇ ਜਵਾਬ ਦੇਵੇਗਾ!
2. **🔨 Live Mandi Bidding & Auction Engine (ਮੰਡੀ ਲਾਈਵ ਬੋਲੀ)**: ਕਿਸਾਨ ਆਪਣੀ ਫਸਲ (ਜਿਵੇਂ 500 ਕੁਇੰਟਲ ਕਣਕ/ਝੋਨਾ/ਆਲੂ) ਦਾ ਲਾਈਵ ਨੀਲਾਮੀ ਬੋਰਡ ਲਗਾਏਗਾ। ਵੱਖ-ਵੱਖ ਮੰਡੀ ਵਪਾਰੀ ਤੇ ਮਿੱਲਾਂ ਲਾਈਵ ਬੋਲੀ ਲਗਾਉਣਗੇ। ਕਿਸਾਨ ਨੂੰ **₹100-₹200/ਕੁਇੰਟਲ ਵਾਧੂ ਰੇਟ** ਮਿਲੇਗਾ (500 ਕੁਇੰਟਲ 'ਤੇ ₹50,000-₹1,00,000 ਦੀ ਸਿੱਧੀ ਵਾਧੂ ਆਮਦਨ)!
3. **🛰️ Satellite Farm Health Radar (ISRO/Sentinel ਖੇਤ ਨਿਗਰਾਨੀ)**: ਸੈਟੇਲਾਈਟ ਹਰ 3 ਦਿਨ ਬਾਅਦ ਕਿਸਾਨ ਦੇ ਖੇਤ ਦੀ ਸਕੈਨਿੰਗ ਕਰੇਗੀ। ਮੋਬਾਈਲ ਮੈਪ 'ਤੇ ਲਾਲ ਨਿਸ਼ਾਨ ਦੱਸੇਗਾ: *"ਖੇਤ ਨੰਬਰ 3 ਦੇ ਉੱਤਰ-ਪੂਰਬੀ ਕੋਨੇ ਵਿੱਚ ਪਾਣੀ ਦੀ ਘਾਟ/ਬੀਮਾਰੀ ਹੈ"*।
4. **🛍️ Village Bulk Group Buying Pool (ਸਾਂਝੀ ਖਾਦ/ਬੀਜ ਖਰੀਦ)**: ਪਿੰਡ ਦੇ 50 ਕਿਸਾਨ ਮਿਲ ਕੇ 1,000 ਬੋਰੀਆਂ DAP ਦਾ ਆਰਡਰ ਦੇਣਗੇ $\rightarrow$ ਫੈਕਟਰੀ ਹੋਲਸੇਲ ਰੇਟ 'ਤੇ ₹250/ਬੋਰੀ ਬਚਤ (₹2,500 ਦੀ ਸਿੱਧੀ ਬਚਤ)!
5. **📜 Government Subsidy Auto-Claim Engine (ਸਰਕਾਰੀ ਸਬਸਿਡੀ ਆਟੋ-ਫਾਰਮ)**: DSR, ਸੋਲਰ ਪੰਪ, ਹੈਪੀ ਸੀਡਰ ਸਬਸਿਡੀ ਦਾ 1-ਕਲਿੱਕ ਆਟੋ-ਫਾਰਮ ਭਰ ਕੇ ਕਿਸਾਨ ਨੂੰ ₹20,000-₹1.5 ਲੱਖ ਦਾ ਮੁਫ਼ਤ ਸਰਕਾਰੀ ਫੰਡ ਦਿਵਾਉਣਾ।
---

<a name="11-freemium-pricing"></a>
## 11. 💰 3 Disruption Features: FREE vs PAID Monetization & Implementation Plan
- **🎙️ Voice Punjabi AI Assistant**:
  - **FREE Tier**: 10 Voice Commands / Month (Teaser).
  - **PRO / Paid Tier**: **UNLIMITED Voice Commands** (Removes all typing effort).
  - **Tech**: OpenAI Whisper STT + Gemini Punjabi NLU + Google Wavenet Punjabi TTS.
- **🛰️ Satellite Farm Health Radar**:
  - **FREE Tier**: 1 Free Scan per Crop Cycle.
  - **PRO / Paid Tier**: **Bi-weekly Scans (Every 3-5 days) + Red Zone Disease Overlay**.
  - **Tech**: Copernicus Sentinel-2 Satellite API + ISRO Bhuvan + NDVI Index Engine ($\frac{NIR - Red}{NIR + Red}$).
- **📈 AI Mandi Price Prediction & Forward Lock**:
  - **FREE Tier**: Live Prices + 3-Day Trend Arrow.
  - **PRO / Paid Tier**: **30-Day AI Price Forecast + Forward Price Escrow Contracts**.
  - **Tech**: 5-Year Agmarknet ML Prophet Model + Buyer Deposit Escrow Engine.






