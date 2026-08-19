-- AlterEnum
ALTER TYPE "CouponKind" ADD VALUE 'REFERRAL_WELCOME';

-- AlterTable users
ALTER TABLE "users" ADD COLUMN "referredById" TEXT;
ALTER TABLE "users" ADD COLUMN "referralWelcomeCouponCode" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable app_settings
ALTER TABLE "app_settings" ADD COLUMN "referralCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5;
ALTER TABLE "app_settings" ADD COLUMN "referralDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10;
ALTER TABLE "app_settings" ADD COLUMN "referralMaxDiscountCap" DECIMAL(10,2) NOT NULL DEFAULT 100;
ALTER TABLE "app_settings" ADD COLUMN "referralOrderLimit" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "app_settings" ADD COLUMN "referralCouponValidityDays" INTEGER NOT NULL DEFAULT 365;
