-- CreateEnum
CREATE TYPE "CouponKind" AS ENUM ('GENERIC', 'PERSONAL_INVITE', 'PARTNER_REFERRAL');

-- AlterTable coupons
ALTER TABLE "coupons" ADD COLUMN "minOrderAmount" DECIMAL(10,2);
ALTER TABLE "coupons" ADD COLUMN "kind" "CouponKind" NOT NULL DEFAULT 'GENERIC';

-- AlterTable app_settings
ALTER TABLE "app_settings" ADD COLUMN "partnerCouponDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10;
ALTER TABLE "app_settings" ADD COLUMN "partnerCouponCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5;
ALTER TABLE "app_settings" ADD COLUMN "partnerCouponMinOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 500;
ALTER TABLE "app_settings" ADD COLUMN "partnerCouponMaxDiscountCap" DECIMAL(10,2) NOT NULL DEFAULT 100;
ALTER TABLE "app_settings" ADD COLUMN "partnerCouponValidityDays" INTEGER NOT NULL DEFAULT 365;
