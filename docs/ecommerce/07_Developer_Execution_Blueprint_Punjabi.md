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
