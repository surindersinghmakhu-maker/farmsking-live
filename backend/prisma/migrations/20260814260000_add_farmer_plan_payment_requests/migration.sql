-- CreateTable
CREATE TABLE "farmer_plan_payment_requests" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "targetPlan" "FarmerSubscriptionPlan" NOT NULL,
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

    CONSTRAINT "farmer_plan_payment_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "farmer_plan_payment_requests_farmerId_idx" ON "farmer_plan_payment_requests"("farmerId");
CREATE INDEX "farmer_plan_payment_requests_status_idx" ON "farmer_plan_payment_requests"("status");

ALTER TABLE "farmer_plan_payment_requests" ADD CONSTRAINT "farmer_plan_payment_requests_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "farmer_plan_payment_requests" ADD CONSTRAINT "farmer_plan_payment_requests_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
