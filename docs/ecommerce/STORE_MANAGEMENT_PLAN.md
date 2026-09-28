# 🏬 FarmsKing Master Store Management Plan & Execution Architecture
**ਫਾਰਮਸਕਿੰਗ ਸਟੋਰ ਪ੍ਰਬੰਧਨ ਯੋਜਨਾ ਅਤੇ ਡਿਵੈਲਪਰ ਤਕਨੀਕੀ ਗਾਈਡ**

---

## 1. 🌟 Overview & Objectives / ਖੁਲਾਸਾ
FarmsKing Store Ecosystem provides an **Amazon & Shopify-grade multi-vendor agricultural e-commerce platform** tailored for farmers, agri-dealers, equipment manufacturers, and natural organic food producers across India.

### Key Capabilities & Master Features
1. **Amazon-Grade Product Listing & Variant Management**:
   - Multiple product images with automatic compression and zoom preview.
   - Dynamic pack sizes & variant pricing (e.g. 250ml, 500ml, 1L, 5L, 50kg bag).
   - Category & subcategory classification (Seeds, Fertilizers, Crop Protection, Bio Organics, Farmer-Made Foods, Agri Tools).
   - MRP vs. Selling Price discounting & instant savings badge.
   - HSN Code, GST % rate selection (0%, 5%, 12%, 18%).
   - Technical formula, active ingredients, dosage per acre, and target crop guidance.
   - 1 to 5 Star Customer Rating & Review feedback system.

2. **Full-Power Admin Verification & Document Inspection Hub**:
   - Comprehensive seller onboarding review.
   - Full-screen high-res document viewer for uploaded **GST Certificates**, **PAN Cards**, and **Bank Cancelled Cheques/Passbooks**.
   - Live GSTIN Verification with automatic state identification & 10-digit PAN extraction.
   - Custom Platform Commission Fee configuration per store (e.g. 5%, 8%, 10%).
   - Approval/Rejection workflow with mandatory rejection reason messaging.

3. **CA-Grade 1% GST TCS & GSTR-8 Tax Management**:
   - Automated 1% Tax Collected at Source (0.5% CGST + 0.5% SGST) calculation on net taxable supplies under Section 52 of CGST Act.
   - Dynamic monthly GSTR-8 report generator with itemized order breakdown.
   - Database self-healing sync routines ensuring no orphaned order items miss seller attribution.

4. **Multi-Channel Express Delivery & 2-Step Checkout**:
   - 2-Step Customer Checkout Wizard with live pincode lookup.
   - Direct UPI QR Code payments, COD, and PhonePe gateway integration.
   - Shiprocket multi-origin warehouse pickup point support.

---

## 2. 🗄️ Database Schema Architecture (Prisma Reference)

```prisma
model SellerStore {
  id                         String          @id @default(uuid())
  sellerId                   String          @unique
  seller                     User            @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  storeName                  String
  slug                       String          @unique
  legalName                  String?
  gstin                      String?         @unique
  panNumber                  String?
  kycStatus                  SellerKycStatus @default(PENDING)
  rejectionReason            String?
  bankAccountNo              String?
  bankIfsc                   String?
  bankBeneficiaryName        String?
  pickupAddress              String?
  pickupCity                 String?
  pickupState                String?
  pickupPincode              String?
  gstDocUrl                  String?
  panDocUrl                  String?
  chequeDocUrl               String?
  commissionRate             Decimal         @default(5.00) @db.Decimal(5, 2)
  rating                     Float           @default(4.8)
  isActive                   Boolean         @default(true)
  createdAt                  DateTime        @default(now())
  updatedAt                  DateTime        @updatedAt

  products     Product[]
  payouts      SellerPayout[]
  orderItems   CustomerOrderItem[]
  gstr8Reports Gstr8Report[]
}

model Product {
  id            String       @id @default(uuid())
  name          String
  description   String?
  category      String?
  unit          String       @default("piece")
  price         Decimal      @db.Decimal(12, 2)
  rating        Float        @default(4.8)
  stockQty      Int          @default(0)
  isActive      Boolean      @default(true)
  sellerStoreId String?
  sellerStore   SellerStore? @relation(fields: [sellerStoreId], references: [id], onDelete: SetNull)
  sku           String?
  hsnCode       String?
  gstPercentage Decimal      @default(18.00) @db.Decimal(5, 2)
  createdAt     DateTime     @default(now())
}
```

---

## 3. 🚀 Developer API Endpoints Summary

| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/seller/store` | SELLER / FARMER | Register a new seller store |
| `GET` | `/api/seller/store/me` | SELLER | Fetch current user's seller store profile & stats |
| `PATCH` | `/api/seller/store/kyc` | SELLER | Update store details / resubmit rejected KYC |
| `GET` | `/api/seller/admin/stores` | ADMIN | List all seller stores for verification |
| `PATCH` | `/api/seller/admin/stores/:id/kyc` | ADMIN | Verify or reject seller store KYC with custom commission % |
| `GET` | `/api/seller/admin/gstr8` | ADMIN / CA | Generate monthly 1% GST TCS GSTR-8 tax report |
| `POST` | `/api/products` | ADMIN / SELLER | Add Amazon-style product to store |
| `GET` | `/api/products` | PUBLIC | Fetch active products for customer shop |

---

## 4. 🎨 UI & UX Best Practices

1. **Cross-Platform Compatibility**:
   - `showAlert` helper guarantees modals work seamlessly across Web browsers (Chrome, Edge, Safari) and Expo Native Mobile Apps.
2. **Royal Aesthetics**:
   - High-contrast midnight backgrounds (`#0B0F17`, `#111827`, `#1F2937`), emerald green badges (`#10B981`, `#059669`), and royal gold highlights (`#F59E0B`).
3. **Zero Placeholder Policy**:
   - Real product images, clear GST & HSN codes, verified delivery addresses, and explicit error messaging.
