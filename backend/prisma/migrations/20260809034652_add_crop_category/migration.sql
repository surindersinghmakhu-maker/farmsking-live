-- CreateEnum
CREATE TYPE "CropCategory" AS ENUM ('FLOWERS', 'VEGETABLES', 'FRUITS', 'GRAINS', 'PULSES', 'SPICES', 'CASH_CROP', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'GARDENER';
ALTER TYPE "Role" ADD VALUE 'CUSTOMER';
ALTER TYPE "Role" ADD VALUE 'BUSINESS_PARTNER';

-- AlterTable
ALTER TABLE "crop_cycles" ADD COLUMN     "category" "CropCategory";

-- CreateTable
CREATE TABLE "gardens" (
    "id" TEXT NOT NULL,
    "gardenerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "area" DOUBLE PRECISION,
    "healthScore" INTEGER NOT NULL DEFAULT 85,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garden_visits" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "visitTitle" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garden_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "unit" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isTopSeller" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In Transit',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "customer_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_referrals" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "referredName" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 750,
    "status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "partner_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gardens_gardenerId_idx" ON "gardens"("gardenerId");

-- CreateIndex
CREATE INDEX "garden_visits_gardenId_idx" ON "garden_visits"("gardenId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_orderNumber_key" ON "customer_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "customer_orders_customerId_idx" ON "customer_orders"("customerId");

-- CreateIndex
CREATE INDEX "customer_order_items_orderId_idx" ON "customer_order_items"("orderId");

-- CreateIndex
CREATE INDEX "partner_referrals_partnerId_idx" ON "partner_referrals"("partnerId");

-- AddForeignKey
ALTER TABLE "gardens" ADD CONSTRAINT "gardens_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_visits" ADD CONSTRAINT "garden_visits_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
