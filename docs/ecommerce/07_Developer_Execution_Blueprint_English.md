# FarmsKing E-Commerce Developer Execution Blueprint
**Technical Architecture, Database Schemas & API Specifications**

---

## 1. Tech Stack Overview
- **Backend Framework**: NestJS (Node.js) with TypeScript
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Frontend App**: Expo React Native (Cross-Platform Mobile & Web)
- **Payment Gateway**: Cashfree Marketplace Split Payout SDK
- **Logistics Integration**: Shiprocket REST API

---

## 2. Database Schema (Prisma Snippet)
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
