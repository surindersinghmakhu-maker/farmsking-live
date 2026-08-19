-- CreateEnum
CREATE TYPE "OrderPaymentMode" AS ENUM ('COD', 'ONLINE');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "customer_orders"
  ADD COLUMN "paymentMode" "OrderPaymentMode" NOT NULL DEFAULT 'COD',
  ADD COLUMN "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN "phonepeMerchantOrderId" TEXT,
  ADD COLUMN "phonepePaymentState" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_phonepeMerchantOrderId_key" ON "customer_orders"("phonepeMerchantOrderId");
