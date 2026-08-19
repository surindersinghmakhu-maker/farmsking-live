-- CreateEnum
CREATE TYPE "PlanPaymentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "plan_payment_requests" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "daysGranted" INTEGER NOT NULL,
    "status" "PlanPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "utr" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "plan_payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_payment_requests_farmerId_idx" ON "plan_payment_requests"("farmerId");

-- CreateIndex
CREATE INDEX "plan_payment_requests_subscriptionId_idx" ON "plan_payment_requests"("subscriptionId");

-- CreateIndex
CREATE INDEX "plan_payment_requests_status_idx" ON "plan_payment_requests"("status");

-- AddForeignKey
ALTER TABLE "plan_payment_requests" ADD CONSTRAINT "plan_payment_requests_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_payment_requests" ADD CONSTRAINT "plan_payment_requests_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "advisor_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_payment_requests" ADD CONSTRAINT "plan_payment_requests_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
