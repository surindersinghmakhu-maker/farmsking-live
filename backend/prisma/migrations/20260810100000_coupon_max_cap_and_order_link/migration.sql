-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "commissionMaxCap" DECIMAL(10,2),
ADD COLUMN     "discountMaxCap" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "customer_orders" ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "coupon_redemptions" ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "creditedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "customer_orders_couponId_idx" ON "customer_orders"("couponId");

-- CreateIndex
CREATE INDEX "coupon_redemptions_orderId_idx" ON "coupon_redemptions"("orderId");

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
