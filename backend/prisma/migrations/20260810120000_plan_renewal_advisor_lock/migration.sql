-- AlterTable
ALTER TABLE "plan_renewal_coupons" ADD COLUMN     "assignedAdvisorId" TEXT;

-- AddForeignKey
ALTER TABLE "plan_renewal_coupons" ADD CONSTRAINT "plan_renewal_coupons_assignedAdvisorId_fkey" FOREIGN KEY ("assignedAdvisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
