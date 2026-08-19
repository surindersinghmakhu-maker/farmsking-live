-- Business-partner issuance for farmer-plan coupons
ALTER TABLE "farmer_plan_coupons" ADD COLUMN "assignedBusinessPartnerId" TEXT;
ALTER TABLE "farmer_plan_coupons" ADD CONSTRAINT "farmer_plan_coupons_assignedBusinessPartnerId_fkey" FOREIGN KEY ("assignedBusinessPartnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "farmer_plan_coupons_assignedBusinessPartnerId_idx" ON "farmer_plan_coupons"("assignedBusinessPartnerId");

-- Super-admin-editable price + commission-split config, one row per paid plan tier
CREATE TABLE "farmer_plan_pricing" (
    "id" TEXT NOT NULL,
    "plan" "FarmerSubscriptionPlan" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "billingPeriodDays" INTEGER NOT NULL,
    "partnerShareType" "DiscountValueType" NOT NULL,
    "partnerShareValue" DECIMAL(10,2) NOT NULL,
    "advisorShareValue" DECIMAL(10,2),
    "adminShareValue" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "farmer_plan_pricing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "farmer_plan_pricing_plan_key" ON "farmer_plan_pricing"("plan");

ALTER TABLE "farmer_plan_pricing" ADD CONSTRAINT "farmer_plan_pricing_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the three paid tiers with the pricing the user specified
INSERT INTO "farmer_plan_pricing" ("id", "plan", "price", "billingPeriodDays", "partnerShareType", "partnerShareValue", "advisorShareValue", "adminShareValue", "updatedAt")
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'BASIC', 200.00, 365, 'PERCENTAGE', 10.00, NULL, NULL, now()),
  ('a1000000-0000-4000-8000-000000000002', 'STANDARD', 700.00, 30, 'FIXED', 50.00, 500.00, 150.00, now()),
  ('a1000000-0000-4000-8000-000000000003', 'PREMIUM', 1200.00, 30, 'FIXED', 80.00, 900.00, 220.00, now());
