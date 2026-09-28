# FarmsKing E-Commerce Master Manual & Operations Guide
**Complete Multi-Seller Marketplace Platform Blueprint**

---

## 1. Executive Overview
The FarmsKing E-Commerce Platform is a multi-seller marketplace engineered for agricultural inputs (seeds, fertilizers, pesticides, tools, heavy machinery). It seamlessly connects Sellers (Local Ag-Stores), Buyers (Farmers), Logistics (Shiprocket API), and Financial Compliance (1% GST TCS withholding).

---

## 2. Core Business Rules & Profit Split
* **FarmsKing Platform Fee**: 10% on gross item sale price.
* **GST TCS Rate**: 1% withheld from seller payout and deposited to the Government under Sec 52 CGST Act.
* **Free Delivery Rule (50-50 Cost Sharing)**:
  - If a seller offers Free Delivery, the shipping fee is shared **50-50% equally** between FarmsKing and the Seller.
  - **Example (Product ₹2000, Actual Shipping ₹400)**:
    - FarmsKing Commission (10%): ₹200
    - FarmsKing Share of Shipping: ₹200
    - Net FarmsKing Profit: ₹0 (No loss, 10% commission completely covers FarmsKing's share of shipping fee).
    - Seller Product Base: ₹1800
    - Seller Share of Shipping: ₹200
    - Seller Final Payout: ₹1600 (- 1% GST TCS).

---

## 3. Shipping & Logistics System
1. **Shiprocket API Integration**: Automatic pincode serviceability check, courier allocation (Delhivery, BlueDart, Ekart), and live tracking.
2. **Delivery Modes**:
   - **FarmsKing Courier (Shiprocket)**: Automatic door-step delivery.
   - **Seller Self-Delivery**: For heavy machinery or hyper-local deliveries.
   - **Local Store Pickup**: Farmer directly picks up from seller store (Zero delivery fee).

---

## 4. Key Stakeholders & Responsibilities
| Stakeholder | Primary Role | Key Focus |
|---|---|---|
| **Sellers** | Product listing, quality packaging, inventory accuracy | 10% commission, 50-50 free shipping rule, weekly payouts |
| **ICICI Bank** | E-Commerce Nodal / Escrow Account | Compliance with RBI aggregator rules, automated split APIs |
| **Chartered Accountant** | GST TCS Compliance & Filing | Monthly GSTR-8 return filing, TCS certificate generation |
| **Cashfree Gateway** | Online Payments & Split Payouts | Instant order payment processing, automated vendor split |
| **Shiprocket** | Multi-vendor pickup & shipping | API credentials, pickup location sync, return order logistics |

---

## 5. Dispute Resolution & Anti-Fraud Protocols
1. **Wrong/Damaged Product**: Mandatory Unboxing Video required from buyer; Seller must replace within 48h or 100% refund issued.
2. **Delayed Delivery**: Real-time tracking alerts sent via SMS/App. Orders delayed over 7 days can be cancelled with 100% refund.
3. **Refused Delivery (RTO)**: Return courier charges deducted from seller payout for invalid seller descriptions.
4. **Counterfeit Goods / Expired Chemicals**: Instant seller suspension + ₹10,000 penalty.

---

## 6. Official Terms & Conditions
- All sellers must possess valid GSTIN, PAN Card, and verified Bank Account.
- Sellers listing pesticides/fertilizers must upload valid State Agriculture Licenses.
- All payouts are settled every Thursday via Cashfree Auto-Payout API.
