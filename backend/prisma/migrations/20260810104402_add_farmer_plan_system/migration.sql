-- CreateEnum
CREATE TYPE "FarmerSubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PREMIUM');

-- CreateTable
CREATE TABLE "farmer_plans" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "plan" "FarmerSubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "couponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_plan_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plan" "FarmerSubscriptionPlan" NOT NULL,
    "daysGranted" INTEGER NOT NULL,
    "assignedFarmerId" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedByFarmerId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_plan_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farmer_plans_farmerId_key" ON "farmer_plans"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_plan_coupons_code_key" ON "farmer_plan_coupons"("code");

-- CreateIndex
CREATE INDEX "farmer_plan_coupons_assignedFarmerId_idx" ON "farmer_plan_coupons"("assignedFarmerId");

-- CreateIndex
CREATE INDEX "farmer_plan_coupons_createdById_idx" ON "farmer_plan_coupons"("createdById");

-- AddForeignKey
ALTER TABLE "farmer_plans" ADD CONSTRAINT "farmer_plans_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_plans" ADD CONSTRAINT "farmer_plans_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "farmer_plan_coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_plan_coupons" ADD CONSTRAINT "farmer_plan_coupons_assignedFarmerId_fkey" FOREIGN KEY ("assignedFarmerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_plan_coupons" ADD CONSTRAINT "farmer_plan_coupons_usedByFarmerId_fkey" FOREIGN KEY ("usedByFarmerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_plan_coupons" ADD CONSTRAINT "farmer_plan_coupons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
