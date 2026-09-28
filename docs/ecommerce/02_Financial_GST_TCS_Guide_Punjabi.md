# FarmsKing Financial, Banking & GST TCS Compliance Guide
**ਵਿੱਤੀ ਨਿਯਮ, ਬੈਂਕਿੰਗ, ਟੈਕਸ ਅਤੇ GST TCS ਗਾਈਡ**

---

## 1. Banking Architecture / ਬੈਂਕਿੰਗ ਅਕਾਊਂਟ ਸੈੱਟਅੱਪ
ਈ-ਕੋਮਰਸ ਮਾਰਕੀਟਪਲੇਸ ਚਲਾਉਣ ਲਈ FarmsKing ਨੂੰ ਹੇਠ ਲਿਖੇ ਬੈਂਕ ਅਕਾਊਂਟ ਚਾਹੀਦੇ ਹਨ:

1. **ICICI Bank E-Commerce Nodal / Escrow Account**:
   - ਕਿਸਾਨਾਂ ਦਾ ਸਾਰਾ ਪੈਸਾ ਪਹਿਲਾਂ ਇਸ ਅਕਾਊਂਟ ਵਿੱਚ ਆਉਂਦਾ ਹੈ।
   - ਇਹ ਅਕਾਊਂਟ ਆਰ.ਬੀ.ਆਈ (RBI) ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਈ-ਕੋਮਰਸ ਮਾਰਕੀਟਪਲੇਸ ਲਈ ਹੁੰਦਾ ਹੈ।
2. **Cashfree Marketplace Split Gateway**:
   - ਪੇਮੈਂਟ ਮਿਲਦੇ ਹੀ FarmsKing ਦਾ 10% ਕਮਿਸ਼ਨ FarmsKing ਦੇ ਕਰੰਟ ਅਕਾਊਂਟ ਵਿੱਚ ਅਤੇ ਬਾਕੀ ਸੈਲਰ ਦੇ ਅਕਾਊਂਟ ਵਿੱਚ ਆਟੋਮੈਟਿਕ ਵੰਡਿਆ ਜਾਂਦਾ ਹੈ।

---

## 2. GST TCS (Tax Collected at Source) - 1% Rule
* **ਕਾਨੂਨੀ ਨਿਯਮ (Sec 52 of CGST Act)**: ਈ-ਕੋਮਰਸ ਪਲੇਟਫਾਰਮ ਲਈ ਹਰੇਕ ਸੈਲਰ ਦੀ ਵਿਕਰੀ 'ਤੇ 1% GST TCS (0.5% CGST + 0.5% SGST ਜਾਂ 1% IGST) ਕੱਟਣਾ ਲਾਜ਼ਮੀ ਹੈ।
* **ਉਦਾਹਰਨ**:
  - ਉਤਪਾਦ ਦੀ ਕੀਮਤ: ₹1,000
  - GST TCS (1%): ₹10 (ਇਹ ਪੈਸਾ FarmsKing ਸਰਕਾਰ ਕੋਲ ਜਮ੍ਹਾਂ ਕਰਵਾਏਗਾ)।
  - ਸੈਲਰ ਨੂੰ GST ਕ੍ਰੈਡਿਟ (ITC) ਮਿਲੇਗਾ, ਜਿਸ ਨਾਲ ਉਹ ਆਪਣੇ ਟੈਕਸ ਵਿੱਚੋਂ ਇਸਨੂੰ ਐਡਜਸਟ ਕਰ ਸਕਦਾ ਹੈ।

---

## 3. C.A. (Chartered Accountant) Reports & Filing
FarmsKing ਐਡਮਿਨ ਪੈਨਲ ਵਿੱਚ C.A. ਲਈ ਇੱਕ ਖਾਸ ਡੈਸ਼ਬੋਰਡ / ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਸੈਕਸ਼ਨ ਹੋਵੇਗਾ:
* **GSTR-8 Monthly Report**:
  - ਹਰ ਮਹੀਨੇ ਦੀ 10 ਤਰੀਕ ਤੋਂ ਪਹਿਲਾਂ GSTR-8 ਫਾਈਲ ਕਰਨਾ ਹੁੰਦਾ ਹੈ।
  - Excel/CSV ਫਾਰਮੈਟ ਵਿੱਚ ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਹੋਵੇਗੀ ਜਿਸ ਵਿੱਚ: GSTIN, Total Sales, Returned Sales, Net Value, TCS Amount ਸ਼ਾਮਲ ਹੋਵੇਗਾ।

---

## 4. Weekly Payout Schedule / ਪੇਆਊਟ ਸਮਾਂ-ਸਾਰਣੀ
- **ਸੈਟਲਮੈਂਟ ਸਾਈਕਲ**: T+7 ਦਿਨ (ਆਰਡਰ ਡਿਲਿਵਰ ਹੋਣ ਤੋਂ 7 ਦਿਨ ਬਾਅਦ, ਤਾਂ ਜੋ ਰਿਟਰਨ ਵਿੰਡੋ ਪੂਰੀ ਹੋ ਸਕੇ)।
- **ਪੇਆਊਟ ਦਿਨ**: ਹਰ ਵੀਰਵਾਰ (Thursday)।
- **ਆਟੋਮੇਸ਼ਨ**: Cashfree Auto-Payout API ਰਾਹੀਂ ਸਿੱਧਾ ਸੈਲਰ ਦੇ ਬੈਂਕ ਅਕਾਊਂਟ ਵਿੱਚ।
