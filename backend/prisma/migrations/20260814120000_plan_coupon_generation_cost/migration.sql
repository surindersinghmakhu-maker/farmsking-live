-- Adds Super-Admin-configurable "generation cost" percentages so issuing a plan coupon to a
-- Business Partner/Advisor can immediately debit a prorated share of the plan price from their
-- wallet, and a snapshot of that debited amount on the coupon itself for display.
ALTER TABLE "farmer_plan_pricing" ADD COLUMN "partnerGenerationCostPercent" DECIMAL(5,2);
ALTER TABLE "farmer_plan_pricing" ADD COLUMN "advisorGenerationCostPercent" DECIMAL(5,2);

ALTER TABLE "farmer_plan_coupons" ADD COLUMN "generationCostAmount" DECIMAL(10,2);
