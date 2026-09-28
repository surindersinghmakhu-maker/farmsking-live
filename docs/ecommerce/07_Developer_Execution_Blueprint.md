# FarmsKing E-Commerce Developer Execution Blueprint
**ਡਿਵੈਲਪਰ ਤਕਨੀਕੀ ਬਲੂਪ੍ਰਿੰਟ ਅਤੇ ਡਾਟਾਬੇਸ ਸਕੀਮਾ**

---

## 1. Core Architecture / ਆਰਕੀਟੈਕਚਰ
FarmsKing ਈ-ਕੋਮਰਸ ਮੋਡਿਊਲ ਵਿੱਚ ਹੇਠ ਲਿਖੇ ਮੁੱਖ ਘਟਕ ਸ਼ਾਮਲ ਹਨ:
* **Backend**: NestJS (Node.js) with Prisma ORM & PostgreSQL
* **Frontend**: React Native (Expo) for Mobile App & Web
* **Payment**: Cashfree Payments SDK + Split Payout APIs
* **Logistics**: Shiprocket REST API

---

## 2. Key Database Models (Prisma Schema Reference)
```prisma
model SellerStore {
  id             String        @id @default(uuid())
  businessName   String
  gstin          String        @unique
  panNumber      String
  bankAccountNo  String
  ifscCode       String
  isVerified     Boolean       @default(false)
  products       Product[]
  payouts        SellerPayout[]
  createdAt      DateTime      @default(now())
}

model Product {
  id             String        @id @default(uuid())
  storeId        String
  store          SellerStore   @relation(fields: [storeId], references: [id])
  title          String
  price          Float
  discountPrice  Float?
  isFreeDelivery Boolean       @default(false)
  volumetricWeight Float?
  stockQuantity  Int           @default(0)
}

model SellerPayout {
  id             String      @id @default(uuid())
  storeId        String
  store          SellerStore @relation(fields: [storeId], references: [id])
  grossAmount    Float
  platformFee    Float       // 10%
  gstTcsAmount   Float       // 1%
  shippingDeduction Float    // 50% share if Free Delivery
  netPayout      Float
  status         String      // PENDING, PAID, HELD
  createdAt      DateTime    @default(now())
}
```

---

## 3. Implementation Step-by-Step Checklist
1. [ ] Extend Prisma Schema with `SellerStore`, `SellerPayout`, and `ShippingLog` models.
2. [ ] Integrate Cashfree Marketplace Vendor Creation & Split Order API.
3. [ ] Integrate Shiprocket Logistics API for multi-vendor pickup points.
4. [ ] Build CA Admin Dashboard to export CSV/Excel reports for GSTR-8 (1% TCS).
5. [ ] Build Seller Mobile UI in Expo React Native (`(seller)/dashboard`, `(seller)/add-product`).
6. [ ] Implement automated 50-50 free delivery calculation logic in order processing.
