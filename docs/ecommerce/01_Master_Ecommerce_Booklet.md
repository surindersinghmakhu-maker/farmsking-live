# FarmsKing E-Commerce Master Manual & Operations Guide
**ਈ-ਕੋਮਰਸ ਮਲਟੀ-ਸੈਲਰ ਸਟੋਰ ਮੈਨੇਜਮੈਂਟ ਸਿਸਟਮ - ਸੰਪੂਰਨ ਗਾਈਡ**

---

## 1. Executive Overview / ਮੁੱਖ ਉਦੇਸ਼
FarmsKing ਦਾ ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਖੇਤੀਬਾੜੀ ਉਤਪਾਦਾਂ (ਬੀਜ, ਖਾਦਾਂ, ਟੂਲਸ, ਮਸ਼ੀਨਰੀ) ਦੀ ਖਰੀਦ-ਵੇਚ ਲਈ ਇੱਕ ਮਲਟੀ-ਸੈਲਰ ਮਾਰਕੀਟਪਲੇਸ ਹੈ।
ਇਹ ਸਿਸਟਮ ਸੈਲਰਾਂ (ਸਟੋਰਾਂ), ਖਰੀਦਦਾਰਾਂ (ਕਿਸਾਨਾਂ), ਲੌਜਿਸਟਿਕਸ (ਕੂਰੀਅਰ ਪਾਰਟਨਰ) ਅਤੇ ਵਿੱਤੀ ਕੰਪਲਾਇੰਸ (GST TCS, Tax) ਨੂੰ ਆਟੋਮੈਟਿਕ ਤਰੀਕੇ ਨਾਲ ਜੋੜਦਾ ਹੈ।

---

## 2. Platform Core Rules & Financial Model / ਮੁੱਖ ਨਿਯਮ ਅਤੇ ਕਮਿਸ਼ਨ
* **FarmsKing Platform Fee**: 10% (ਹਰੇਕ ਵਿਕਰੀ 'ਤੇ)।
* **GST TCS Rate**: 1% (ਸਰਕਾਰੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਸੈਲਰ ਦੇ ਹਿੱਸੇ ਵਿੱਚੋਂ ਕੱਟ ਕੇ ਜਮ੍ਹਾਂ)।
* **Free Delivery Rule (ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਨਿਯਮ)**:
  - ਜੇਕਰ ਕਿਸੇ ਉਤਪਾਦ 'ਤੇ ਡਿਲਿਵਰੀ ਮੁਫ਼ਤ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ, ਤਾਂ ਉਸ ਦਾ ਖਰਚਾ FarmsKing ਅਤੇ Seller **50-50% ਅੱਧਾ-ਅੱਧਾ** ਵੰਡਣਗੇ।
  - ਉਦਾਹਰਨ: ₹2000 ਦਾ ਪ੍ਰੋਡਕਟ, ₹400 ਡਿਲਿਵਰੀ ਖਰਚਾ (ਮੁਫ਼ਤ ਦਿੱਤੀ)।
    * FarmsKing Margin (10%): ₹200
    * FarmsKing Share of Shipping: ₹200
    * Net FarmsKing Earning: ₹0 (ਕੋਈ ਘਾਟਾ ਨਹੀਂ, ₹0 ਜੇਬ ਵਿੱਚੋਂ)।
    * Seller Product Price: ₹1800
    * Seller Share of Shipping: ₹200
    * Seller Payout: ₹1600 (- GST TCS).

---

## 3. Shipping & Logistics System / ਡਿਲਿਵਰੀ ਸਿਸਟਮ
1. **Shiprocket API Integration**: ਆਟੋਮੈਟਿਕ ਪਿਨਕੋਡ ਚੈਕਿੰਗ, ਕੂਰੀਅਰ ਚੋਣ (Delhivery, BlueDart, Ekart) ਅਤੇ ਲਾਈਵ ਟਰੈਕਿੰਗ।
2. **Delivery Modes**:
   - **Seller Shipping**: ਸੈਲਰ ਆਪ ਡਿਲਿਵਰ ਕਰਦਾ ਹੈ।
   - **FarmsKing Courier (Shiprocket)**: FarmsKing ਦਾ ਆਟੋਮੈਟਿਕ ਕੂਰੀਅਰ ਸਿਸਟਮ।
   - **Local Store Pickup**: ਕਿਸਾਨ ਆਪ ਦੁਕਾਨ ਤੋਂ ਚੱਕ ਸਕਦਾ ਹੈ।

---

## 4. Key Parties & Communication Protocols / ਸਬੰਧਤ ਧਿਰਾਂ ਅਤੇ ਗੱਲਬਾਤ ਦੇ ਤਰੀਕੇ
| Party (ਧਿਰ) | Role & Responsibility (ਜ਼ਿੰਮੇਵਾਰੀ) | Communication Focus (ਗੱਲਬਾਤ ਦਾ ਵਿਸ਼ਾ) |
|---|---|---|
| **Sellers (ਵਪਾਰੀ)** | ਉਤਪਾਦ ਅੱਪਲੋਡ, ਪੈਕਿੰਗ, ਸਹੀ ਸਟਾਕ | ਰਜਿਸਟ੍ਰੇਸ਼ਨ, 10% ਕਮਿਸ਼ਨ, 50-50 ਡਿਲਿਵਰੀ ਨਿਯਮ, ਹਫ਼ਤਾਵਾਰ ਪੇਆਊਟ |
| **Bank (ICICI Bank)** | ਈ-ਕੋਮਰਸ ਨੋਡਲ / ਐਸਕਰੋ ਅਕਾਊਂਟ | ਨੋਡਲ ਅਕਾਊਂਟ ਖੋਲ੍ਹਣਾ, ਆਟੋਮੈਟਿਕ ਪੇਆਊਟ ਏਪੀਆਈ |
| **Chartered Accountant (CA)** | GSTR-8 ਫਾਈਲਿੰਗ & TCS ਡਿਪਾਜ਼ਿਟ | ਮਹੀਨਾਵਾਰ TCS ਰਿਪੋਰਟ, GSTR-8 ਸਬਮਿਸ਼ਨ, GST ਇਨਪੁਟ ਕ੍ਰੈਡਿਟ |
| **Payment Gateway (Cashfree)** | ਆਨਲਾਈਨ ਪੇਮੈਂਟ + ਆਟੋ ਸਪਲਿਟ ਪੇਆਊਟ | ਨੋਡਲ ਸਪਲਿਟ API, T+2 / T+7 ਪੇਆਊਟ ਸੈਟਲਮੈਂਟ |
| **Logistics (Shiprocket)** | ਕੂਰੀਅਰ ਪਿਕਅੱਪ, ਟਰੈਕਿੰਗ, ਆਰ.ਟੀ.ਓ | ਏਪੀਆਈ ਕੀਅਸ, ਪਿਕਅੱਪ ਐਡਰੈੱਸ, ਰਿਟਰਨ ਆਰਡਰ ਮੈਨੇਜਮੈਂਟ |

---

## 5. Dispute & Risk Management / ਝਗੜੇ ਅਤੇ ਸਮੱਸਿਆਵਾਂ ਦਾ ਹੱਲ
1. **Wrong/Damaged Product**: Unboxing ਵੀਡੀਓ ਲਾਜ਼ਮੀ; ਸੈਲਰ ਬਦਲ ਕੇ ਦੇਵੇਗਾ ਜਾਂ 100% ਰਿਫੰਡ।
2. **Delayed Delivery**: Shiprocket API ਰਾਹੀਂ ਟਰੈਕਿੰਗ ਸੂਚਨਾ ਕਿਸਾਨ ਨੂੰ SMS/App 'ਤੇ ਭੇਜੀ ਜਾਵੇਗੀ।
3. **RTO (Refused Delivery)**: ਰਿਟਰਨ ਡਿਲਿਵਰੀ ਖਰਚਾ ਸੈਲਰ ਦੇ ਪੇਆਊਟ ਵਿੱਚੋਂ ਕੱਟਿਆ ਜਾਵੇਗਾ।
4. **Fake Product / Expired Chemicals**: ਸੈਲਰ ਦਾ ਅਕਾਊਂਟ ਤੁਰੰਤ ਬਲੌਕ + ₹10,000 ਜੁਰਮਾਨਾ।

---

## 6. Official Terms & Conditions / ਕਾਨੂੰਨੀ ਸ਼ਰਤਾਂ
- ਸਾਰੇ ਸੈਲਰਾਂ ਕੋਲ ਵੈਧ GSTIN, PAN Card, ਅਤੇ ਬੈਂਕ ਅਕਾਊਂਟ ਹੋਣਾ ਲਾਜ਼ਮੀ ਹੈ।
- ਕੀਟਨਾਸ਼ਕ / ਦਵਾਈਆਂ ਵੇਚਣ ਵਾਲੇ ਸੈਲਰਾਂ ਕੋਲ ਵੈਧ ਖੇਤੀਬਾੜੀ ਲਾਇਸੈਂਸ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।
- ਸਾਰੇ ਪੇਆਊਟ GST TCS (1%) ਕੱਟ ਕੇ ਹਰ ਵੀਰਵਾਰ ਸੈਲਰ ਅਕਾਊਂਟ ਵਿੱਚ ਟਰਾਂਸਫਰ ਕੀਤੇ ਜਾਣਗੇ।
