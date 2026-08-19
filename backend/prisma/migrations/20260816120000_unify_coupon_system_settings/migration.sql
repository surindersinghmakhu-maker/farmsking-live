-- Create the unified coupon-system settings table
CREATE TABLE "coupon_system_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "partnerCouponDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "partnerCouponCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "partnerCouponMinOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "partnerCouponMaxDiscountCap" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "partnerCouponValidityDays" INTEGER NOT NULL DEFAULT 365,
    "referralCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "referralDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "referralMaxDiscountCap" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "referralOrderLimit" INTEGER NOT NULL DEFAULT 5,
    "referralCouponValidityDays" INTEGER NOT NULL DEFAULT 365,
    "commissionCouponDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "commissionCouponCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "commissionCouponMinOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "commissionCouponMaxDiscountCap" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "commissionCouponValidityDays" INTEGER NOT NULL DEFAULT 30,
    "inviteCouponDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "inviteCouponCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "inviteCouponValidityDays" INTEGER NOT NULL DEFAULT 3650,
    "inviteCouponUsageLimit" INTEGER NOT NULL DEFAULT 100000,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "coupon_system_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "coupon_system_settings" ADD CONSTRAINT "coupon_system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Carry over the existing singleton row's coupon-config values, if it exists
INSERT INTO "coupon_system_settings" (
    "id", "partnerCouponDiscountPercent", "partnerCouponCommissionPercent", "partnerCouponMinOrderAmount",
    "partnerCouponMaxDiscountCap", "partnerCouponValidityDays", "referralCommissionPercent", "referralDiscountPercent",
    "referralMaxDiscountCap", "referralOrderLimit", "referralCouponValidityDays", "commissionCouponDiscountPercent",
    "commissionCouponCommissionPercent", "commissionCouponMinOrderAmount", "commissionCouponMaxDiscountCap",
    "commissionCouponValidityDays", "inviteCouponDiscountPercent", "inviteCouponCommissionPercent",
    "inviteCouponValidityDays", "inviteCouponUsageLimit", "updatedAt", "updatedById"
)
SELECT
    'default', "partnerCouponDiscountPercent", "partnerCouponCommissionPercent", "partnerCouponMinOrderAmount",
    "partnerCouponMaxDiscountCap", "partnerCouponValidityDays", "referralCommissionPercent", "referralDiscountPercent",
    "referralMaxDiscountCap", "referralOrderLimit", "referralCouponValidityDays", "commissionCouponDiscountPercent",
    "commissionCouponCommissionPercent", "commissionCouponMinOrderAmount", "commissionCouponMaxDiscountCap",
    "commissionCouponValidityDays", "inviteCouponDiscountPercent", "inviteCouponCommissionPercent",
    "inviteCouponValidityDays", "inviteCouponUsageLimit", now(), "updatedById"
FROM "app_settings" WHERE "id" = 'default'
ON CONFLICT ("id") DO NOTHING;

-- Drop the now-relocated coupon-config columns from app_settings
ALTER TABLE "app_settings"
    DROP COLUMN "partnerCouponDiscountPercent",
    DROP COLUMN "partnerCouponCommissionPercent",
    DROP COLUMN "partnerCouponMinOrderAmount",
    DROP COLUMN "partnerCouponMaxDiscountCap",
    DROP COLUMN "partnerCouponValidityDays",
    DROP COLUMN "referralCommissionPercent",
    DROP COLUMN "referralDiscountPercent",
    DROP COLUMN "referralMaxDiscountCap",
    DROP COLUMN "referralOrderLimit",
    DROP COLUMN "referralCouponValidityDays",
    DROP COLUMN "commissionCouponDiscountPercent",
    DROP COLUMN "commissionCouponCommissionPercent",
    DROP COLUMN "commissionCouponMinOrderAmount",
    DROP COLUMN "commissionCouponMaxDiscountCap",
    DROP COLUMN "commissionCouponValidityDays",
    DROP COLUMN "inviteCouponDiscountPercent",
    DROP COLUMN "inviteCouponCommissionPercent",
    DROP COLUMN "inviteCouponValidityDays",
    DROP COLUMN "inviteCouponUsageLimit";
