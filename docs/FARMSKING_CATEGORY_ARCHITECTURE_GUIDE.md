# 🌾 FarmsKing Category Architecture & Dynamic Admin Toggle Guide

ਇਹ ਦਸਤਾਵੇਜ਼ FarmsKing ਪ੍ਰੋਜੈਕਟ ਦੀਆਂ ਮੁੱਖ **Categories**, ਉਹਨਾਂ ਦੀਆਂ **Sub-Categories**, **Decoupled Architecture**, ਅਤੇ ਐਡਮਿਨ ਪੈਨਲ ਵਿੱਚ **Dynamic Category & Sub-Category Toggle (ON/OFF)** ਸਿਸਟਮ ਬਾਰੇ ਪੂਰੀ ਜਾਣਕਾਰੀ ਦਿੰਦਾ ਹੈ।

---

## 1. Categories & Sub-Categories ਦੀ ਪੂਰੀ ਵੰਡ

| # | Category ਦਾ ਨਾਮ | Sub-Categories (ਮੋਡਿਊਲ) | ਕੰਮ (Responsibility) |
|---|---|---|---|
| **1** | **User Accounts & Auth** (`user_accounts`) | `auth`, `users`, `addresses`, `audit`, `uploads` | ਯੂਜ਼ਰ ਲੌਗਇਨ, OTP, ਪ੍ਰੋਫਾਈਲ, ਐਡਰੈੱਸ, ਆਡਿਟ ਅਤੇ ਫਾਈਲ ਅਪਲੋਡ। |
| **2** | **Farmer & Agriculture** (`farmer_operations`) | `farms`, `plots`, `crops`, `crop-problems`, `spray-schedules`, `labour`, `expenses` | ਖੇਤ, ਪਲਾਟ, ਫਸਲਾਂ ਦੀ ਬੀਜਾਈ, ਬੀਮਾਰੀਆਂ, ਸਪਰੇਅ ਅਤੇ ਮਜ਼ਦੂਰੀ ਦੇ ਖਰਚੇ। |
| **3** | **Shopping & E-Commerce** (`shopping`) | `products`, `orders`, `sale-bills`, `parties`, `payment-receipts` | ਪ੍ਰੋਡਕਟ ਲਿਸਟਿੰਗ, ਕਾਰਟ/ਚੈੱਕਆਊਟ, ਆਰਡਰ, ਸੇਲ ਬਿੱਲ ਅਤੇ ਖਾਤੇ। |
| **4** | **Advisor & Support** (`advisor_support`) | `advisor-assignment`, `chat`, `call-requests`, `admin-chat` | ਐਡਵਾਈਜ਼ਰ ਅਲਾਟਮੈਂਟ, ਲਾਈਵ ਚੈਟ, ਕਾਲ ਰਿਕਵੈਸਟ ਅਤੇ ਐਡਮਿਨ ਹੈਲਪਲਾਈਨ। |
| **5** | **Coupons, Plans & Financial** (`coupons_financial`) | `coupons`, `subscriptions`, `plan-payments`, `plan-renewal`, `wallet`, `withdrawals`, `phonepe` | ਡਿਸਕਾਊਂਟ ਕੂਪਨ, ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਪਲਾਨ, ਪੇਮੈਂਟ ਗੇਟਵੇਅ (PhonePe), ਵਾਲੇਟ। |
| **6** | **Telephony & Communication** (`telephony_comm`) | `whatsapp`, `voice-call`, `voice-ai`, `notifications` | ਵਟਸਐਪ ਆਟੋਮੇਸ਼ਨ, ਆਡੀਓ ਕਾਲਿੰਗ, ਵਾਇਸ AI ਅਤੇ ਪੁਸ਼ ਨੋਟੀਫਿਕੇਸ਼ਨ। |
| **7** | **Weather & Satellite** (`weather_intelligence`) | `weather`, `satellite`, `mandi-ai`, `market-rates` | ਲਾਈਵ ਮੌਸਮ, ਸੈਟੇਲਾਇਟ NDVI ਨਿਗਰਾਨੀ, ਮੰਡੀ ਰੇਟ। |
| **8** | **System & Infrastructure** (`system_infra`) | `app-settings`, `google-drive-backup`, `referrals`, `dashboard` | ਗਲੋਬਲ ਸੈਟਿੰਗਜ਼, ਡਾਟਾਬੇਸ ਬੈਕਅੱਪ, ਰੈਫਰਲ ਸਿਸਟਮ, ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ। |

---

## 2. Admin Panel ਵਿੱਚ Dynamic Toggle (ON/OFF) ਸਿਸਟਮ

ਐਡਮਿਨ ਪੈਨਲ ਤੋਂ ਕਿਸੇ ਵੀ **Main Category** ਜਾਂ **Sub-Category** ਨੂੰ ਬੰਦ (OFF) ਜਾਂ ਚਾਲੂ (ON) ਕਰਨ ਲਈ 3 ਲੇਅਰ ਸਿਸਟਮ ਬਣਾਇਆ ਗਿਆ ਹੈ:

### (A) Database JSON Feature Flags (`AppSetting` Table)
ਡਾਟਾਬੇਸ ਵਿੱਚ JSON ਫਾਰਮੈਟ ਵਿੱਚ ਹਰੇਕ ਫੀਚਰ ਦੀ ਸਟੇਟਸ ਫਲੈਗ ਰੱਖੀ ਜਾਂਦੀ ਹੈ:

```json
{
  "featureFlags": {
    "shopping": {
      "enabled": true,
      "subCategories": {
        "products": true,
        "orders": true,
        "saleBills": false,
        "parties": true
      }
    },
    "telephony_comm": {
      "enabled": true,
      "subCategories": {
        "whatsapp": true,
        "voiceCall": false,
        "voiceAi": false
      }
    }
  }
}
```

### (B) Backend (NestJS) Route Protection Guard
ਜੇਕਰ ਐਡਮਿਨ ਨੇ ਕਿਸੇ Sub-Category (ਜਿਵੇਂ `saleBills` ਜਾਂ `voiceCall`) ਨੂੰ ਬੰਦ ਕੀਤਾ ਹੈ, ਤਾਂ Backend API ਉਸ ਰੂਟ ਨੂੰ Block ਕਰ ਦੇਵੇਗੀ:

```typescript
@UseGuards(FeatureFlagGuard)
@RequireFeature('shopping', 'saleBills')
@Post('create-bill')
async createSaleBill(@Body() dto: CreateBillDto) {
  return this.saleBillsService.create(dto);
}
```

### (C) Frontend (React / Mobile App) Dynamic UI Hiding
- **Menu Hiding:** ਜੇਕਰ `shopping.saleBills` OFF ਹੈ, ਤਾਂ ਸਾਈਡਬਾਰ ਵਿੱਚੋਂ **'Sale Bills'** ਦਾ ਟੈਬ ਆਪਣੇ ਆਪ ਗਾਇਬ (Hide) ਹੋ ਜਾਵੇਗਾ।
- **Button Disappearing:** ਐਪ ਅੰਦਰ **'Call Advisor'** ਜਾਂ **'WhatsApp Share'** ਬਟਨ ਲਾਈਵ Hide ਹੋ ਜਾਣਗੇ।
- **Disabled Notice:** ਜੇਕਰ ਯੂਜ਼ਰ ਸਿੱਧਾ URL ਖੋਲ੍ਹਦਾ ਹੈ, ਤਾਂ *"ਇਹ ਸੁਵਿਧਾ ਫਿਲਹਾਲ ਐਡਮਿਨ ਦੁਆਰਾ ਬੰਦ ਕੀਤੀ ਗਈ ਹੈ"* ਦਾ ਮੈਸੇਜ ਆਵੇਗਾ।

---

## 3. ਦਸਤਾਵੇਜ਼ ਅਤੇ PDF ਫਾਈਲ ਲੋਕੇਸ਼ਨ

1. **PDF File Path:** [FarmsKing_Category_Architecture_Guide.pdf](file:///d:/FarmsKing/docs/FarmsKing_Category_Architecture_Guide.pdf)
2. **Markdown File Path:** [FARMSKING_CATEGORY_ARCHITECTURE_GUIDE.md](file:///d:/FarmsKing/docs/FARMSKING_CATEGORY_ARCHITECTURE_GUIDE.md)
