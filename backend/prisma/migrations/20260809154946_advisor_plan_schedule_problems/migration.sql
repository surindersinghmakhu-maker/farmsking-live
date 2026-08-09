-- CreateEnum
CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('IRRIGATION', 'FERTILIZER', 'SPRAY', 'MONITORING', 'HARVEST', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'OVERDUE');

-- AlterTable
ALTER TABLE "advisor_assignments" ADD COLUMN     "subscriptionId" TEXT;

-- CreateTable
CREATE TABLE "advisor_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advisor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_subscriptions" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "advisor_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_activity_schedules" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdByAdvisorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "crop_activity_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advisor_subscriptions_farmerId_idx" ON "advisor_subscriptions"("farmerId");

-- CreateIndex
CREATE INDEX "advisor_subscriptions_planId_idx" ON "advisor_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "crop_activity_schedules_cropCycleId_idx" ON "crop_activity_schedules"("cropCycleId");

-- CreateIndex
CREATE INDEX "crop_activity_schedules_createdByAdvisorId_idx" ON "crop_activity_schedules"("createdByAdvisorId");

-- CreateIndex
CREATE INDEX "crop_activity_schedules_scheduledDate_idx" ON "crop_activity_schedules"("scheduledDate");

-- CreateIndex
CREATE INDEX "uploads_uploadedById_idx" ON "uploads"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_assignments_subscriptionId_key" ON "advisor_assignments"("subscriptionId");

-- AddForeignKey
ALTER TABLE "advisor_assignments" ADD CONSTRAINT "advisor_assignments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "advisor_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_subscriptions" ADD CONSTRAINT "advisor_subscriptions_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_subscriptions" ADD CONSTRAINT "advisor_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "advisor_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_subscriptions" ADD CONSTRAINT "advisor_subscriptions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_activity_schedules" ADD CONSTRAINT "crop_activity_schedules_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_activity_schedules" ADD CONSTRAINT "crop_activity_schedules_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_activity_schedules" ADD CONSTRAINT "crop_activity_schedules_createdByAdvisorId_fkey" FOREIGN KEY ("createdByAdvisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

