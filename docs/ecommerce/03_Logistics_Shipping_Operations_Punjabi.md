# FarmsKing Logistics & Shipping Operations Guide
**ਸ਼ਿਪਿੰਗ, ਡਿਲਿਵਰੀ ਅਤੇ ਲੌਜਿਸਟਿਕਸ ਆਪ੍ਰੇਸ਼ਨਜ਼ ਗਾਈਡ**

---

## 1. Overview / ਲੌਜਿਸਟਿਕਸ ਦਾ ਢਾਂਚਾ
FarmsKing ਪਲੇਟਫਾਰਮ 'ਤੇ ਸਮਾਨ ਦੀ ਆਵਾਜਾਈ ਲਈ **Shiprocket API** ਦੀ ਵਰਤੋਂ ਕੀਤੀ ਜਾਂਦੀ ਹੈ, ਜੋ ਭਾਰਤ ਦੇ ਪ੍ਰਮੁੱਖ ਕੂਰੀਅਰ ਪਾਰਟਨਰਾਂ (Delhivery, BlueDart, DTDC, Ekart) ਨਾਲ ਸਿੱਧਾ ਜੁੜੀ ਹੋਈ ਹੈ।

---

## 2. 3 Delivery Modes / ਡਿਲਿਵਰੀ ਦੇ 3 ਤਰੀਕੇ
1. **FarmsKing Courier (Shiprocket Partner)**:
   - ਆਟੋਮੈਟਿਕ ਪਿਕਅੱਪ ਅਤੇ ਡਿਲਿਵਰੀ।
   - ਆਰਡਰ ਆਉਂਦੇ ਹੀ Shiprocket ਰਾਹੀਂ ਲੇਬਲ ਅਤੇ ਮੈਨੀਫੈਸਟ ਜਨਰੇਟ ਹੁੰਦਾ ਹੈ।
2. **Seller Self-Delivery**:
   - ਭਾਰੀ ਮਸ਼ੀਨਰੀ ਜਾਂ ਨੇੜਲੇ ਇਲਾਕਿਆਂ ਵਿੱਚ ਸੈਲਰ ਆਪ ਆਪਣੀ ਗੱਡੀ 'ਤੇ ਡਿਲਿਵਰੀ ਕਰਦਾ ਹੈ।
   - ਸੈਲਰ ਨੂੰ ਐਪ ਵਿੱਚ Tracking ID ਅਤੇ Courier Name ਦਰਜ ਕਰਨਾ ਪੈਂਦਾ ਹੈ।
3. **Local Store Pickup**:
   - ਕਿਸਾਨ ਆਪ ਸੈਲਰ ਦੀ ਦੁਕਾਨ 'ਤੇ ਜਾ ਕੇ ਸਮਾਨ ਚੱਕ ਸਕਦਾ ਹੈ (No Shipping Charge)।

---

## 3. The Free Delivery 50-50 Profit Split Rule / 50-50% ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਨਿਯਮ
ਜਦੋਂ ਸੈਲਰ ਕਿਸੇ ਪ੍ਰੋਡਕਟ 'ਤੇ ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ (Free Shipping) ਦਿੰਦਾ ਹੈ, ਤਾਂ ਉਸ ਦਾ ਖਰਚਾ **FarmsKing** ਅਤੇ **Seller** ਅੱਧਾ-ਅੱਧਾ (50%-50%) ਚੁੱਕਣਗੇ।

### Profit & Cost Calculation Formula / ਹਿਸਾਬ-ਕਿਤਾਬ:
- **Product Price**: \( P \)
- **FarmsKing Commission (10%)**: \( C = 0.10 	imes P \)
- **Actual Shipping Fee**: \( S \)
- **FarmsKing Share**: \( rac{S}{2} \)
- **Seller Share**: \( rac{S}{2} \)
- **FarmsKing Net Earnings**: \( C - rac{S}{2} \)
- **Seller Net Payout**: \( P - C - rac{S}{2} - 	ext{TCS} \)

### Real Case Example:
- **Product Price**: ₹2,000
- **FarmsKing Margin (10%)**: ₹200
- **Actual Shipping Charge**: ₹400 (ਮੁਫ਼ਤ ਡਿਲਿਵਰੀ ਦਿੱਤੀ)
- **FarmsKing Share of Shipping**: ₹200
- **Seller Share of Shipping**: ₹200
- **FarmsKing Final Earning**: \( 200 - 200 = ₹0 \)
- **Seller Final Payout**: \( 2000 - 200 - 200 = ₹1600 \) (- 1% GST TCS).
- **ਸਿੱਟਾ**: FarmsKing ਆਪਣੀ ਜੇਬ੍ਹ ਵਿੱਚੋਂ ₹50 ਨਹੀਂ ਦੇਵੇਗਾ, ਬਲਕਿ 10% ਕਮਿਸ਼ਨ (₹200) ਨਾਲ ਆਪਣੇ ਹਿੱਸੇ ਦਾ shipping ਖਰਚਾ (₹200) ਪੂਰਾ ਹੋ ਜਾਵੇਗਾ!

---

## 4. Seller Product Addition Guidance / ਪ੍ਰੋਡਕਟ ਐਡ ਕਰਦੇ ਸਮੇਂ ਸ਼ਿਪਿੰਗ ਜਾਣਕਾਰੀ
ਪ੍ਰੋਡਕਟ ਐਡ ਕਰਦੇ ਸਮੇਂ ਸੈਲਰ ਨੂੰ ਐਪ ਵਿੱਚ ਹੇਠ ਲਿਖੀਆਂ ਚੀਜ਼ਾਂ ਦਿੱਖਣਗੀਆਂ:
1. **Volumetric Weight Calculator**: ਲੰਬਾਈ, ਚੌੜਾਈ, ਉਚਾਈ ਅਤੇ ਭਾਰ ਦਰਜ ਕਰਦੇ ਹੀ Shiprocket API ਅਨੁਮਾਨਿਤ ਡਿਲਿਵਰੀ ਖਰਚਾ ਦੱਸੇਗੀ।
2. **Shipping Option Choice**:
   - Option A: Standard Shipping Charges (ਕਿਸਾਨ ਡਿਲਿਵਰੀ ਖਰਚਾ ਦੇਵੇਗਾ)।
   - Option B: Free Delivery (50-50 Split Rule ਲਾਗੂ ਹੋਵੇਗਾ)।
