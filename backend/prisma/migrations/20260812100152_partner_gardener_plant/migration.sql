-- CreateEnum
CREATE TYPE "GardenerSubscriptionPlan" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PartnerAssignmentStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "partner_assignments" (
    "id" TEXT NOT NULL,
    "businessPartnerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "PartnerAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "plantedDate" TIMESTAMP(3),
    "healthNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gardener_plans" (
    "id" TEXT NOT NULL,
    "gardenerId" TEXT NOT NULL,
    "plan" "GardenerSubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "couponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gardener_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gardener_plan_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plan" "GardenerSubscriptionPlan" NOT NULL,
    "daysGranted" INTEGER NOT NULL,
    "assignedGardenerId" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedByGardenerId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gardener_plan_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_assignments_customerId_key" ON "partner_assignments"("customerId");

-- CreateIndex
CREATE INDEX "partner_assignments_businessPartnerId_idx" ON "partner_assignments"("businessPartnerId");

-- CreateIndex
CREATE INDEX "plants_gardenId_idx" ON "plants"("gardenId");

-- CreateIndex
CREATE UNIQUE INDEX "gardener_plans_gardenerId_key" ON "gardener_plans"("gardenerId");

-- CreateIndex
CREATE UNIQUE INDEX "gardener_plan_coupons_code_key" ON "gardener_plan_coupons"("code");

-- CreateIndex
CREATE INDEX "gardener_plan_coupons_assignedGardenerId_idx" ON "gardener_plan_coupons"("assignedGardenerId");

-- CreateIndex
CREATE INDEX "gardener_plan_coupons_createdById_idx" ON "gardener_plan_coupons"("createdById");

-- AddForeignKey
ALTER TABLE "partner_assignments" ADD CONSTRAINT "partner_assignments_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_assignments" ADD CONSTRAINT "partner_assignments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gardener_plans" ADD CONSTRAINT "gardener_plans_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gardener_plans" ADD CONSTRAINT "gardener_plans_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "gardener_plan_coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gardener_plan_coupons" ADD CONSTRAINT "gardener_plan_coupons_assignedGardenerId_fkey" FOREIGN KEY ("assignedGardenerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gardener_plan_coupons" ADD CONSTRAINT "gardener_plan_coupons_usedByGardenerId_fkey" FOREIGN KEY ("usedByGardenerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gardener_plan_coupons" ADD CONSTRAINT "gardener_plan_coupons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

