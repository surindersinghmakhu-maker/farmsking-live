ALTER TABLE "app_settings" ADD COLUMN "commissionCouponDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN "commissionCouponCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN "commissionCouponMinOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "commissionCouponMaxDiscountCap" DECIMAL(10,2) NOT NULL DEFAULT 100,
ADD COLUMN "commissionCouponValidityDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "inviteCouponDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN "inviteCouponCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN "inviteCouponValidityDays" INTEGER NOT NULL DEFAULT 3650,
ADD COLUMN "inviteCouponUsageLimit" INTEGER NOT NULL DEFAULT 100000;
