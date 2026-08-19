-- Basic-plan-days coupons: Admin generates at a flat ₹2/day list price; a Business Partner may buy one
-- at a 10% discount (debited from their wallet) before handing the code to a farmer to redeem.
CREATE TABLE "basic_plan_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "daysGranted" INTEGER NOT NULL,
    "listPrice" DECIMAL(10,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "purchasedById" TEXT,
    "purchasePrice" DECIMAL(10,2),
    "purchasedAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedByFarmerId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "basic_plan_coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "basic_plan_coupons_code_key" ON "basic_plan_coupons"("code");

ALTER TABLE "basic_plan_coupons" ADD CONSTRAINT "basic_plan_coupons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "basic_plan_coupons" ADD CONSTRAINT "basic_plan_coupons_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "basic_plan_coupons" ADD CONSTRAINT "basic_plan_coupons_usedByFarmerId_fkey" FOREIGN KEY ("usedByFarmerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
