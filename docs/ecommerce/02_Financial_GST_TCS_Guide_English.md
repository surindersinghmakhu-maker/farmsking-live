# FarmsKing Financial, Banking & GST TCS Compliance Guide
**Financial Rules, Nodal Banking, Tax and GST TCS Policy**

---

## 1. Banking Architecture Setup
Operating a compliant multi-seller marketplace requires two primary banking components:

1. **ICICI Bank E-Commerce Nodal / Escrow Account**:
   - Holds buyer funds temporarily before seller disbursement.
   - Built under RBI guidelines for E-Commerce Market Aggregators.
2. **Cashfree Marketplace Split Gateway**:
   - Automatically splits incoming payments: FarmsKing 10% commission goes to FarmsKing Current Account, while 90% (- 1% GST TCS) goes to the Seller's Account.

---

## 2. GST TCS (Tax Collected at Source) - 1% Rule
* **Statutory Requirement (Sec 52 CGST Act)**: Every e-commerce marketplace operator must deduct 1% GST TCS (0.5% CGST + 0.5% SGST or 1% IGST) on net seller sales.
* **Calculation Example**:
  - Item Sale Price: ₹1,000
  - GST TCS (1%): ₹10 (Deposited directly to the Govt portal under the seller's GSTIN).
  - Seller receives ₹10 as Input Tax Credit (ITC) to offset their monthly GST liability.

---

## 3. C.A. (Chartered Accountant) Reports & GSTR-8 Filing
FarmsKing Admin Portal features a dedicated C.A. Export Hub:
* **GSTR-8 Monthly Export**:
  - Filed monthly before the 10th.
  - CSV/Excel format contains: Seller GSTIN, Gross Sales, Returns, Net Taxable Value, and 1% TCS Amount.

---

## 4. Weekly Payout Schedule
- **Settlement Cycle**: T+7 days (7 days post-delivery to honor return windows).
- **Payout Day**: Every Thursday.
- **Automation**: Executed automatically via Cashfree Auto-Payout API.
