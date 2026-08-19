ALTER TABLE "farmer_plan_coupons" ADD COLUMN "assignedAdvisorId" TEXT;
ALTER TABLE "farmer_plan_coupons" ADD CONSTRAINT "farmer_plan_coupons_assignedAdvisorId_fkey" FOREIGN KEY ("assignedAdvisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "farmer_plan_coupons_assignedAdvisorId_idx" ON "farmer_plan_coupons"("assignedAdvisorId");
