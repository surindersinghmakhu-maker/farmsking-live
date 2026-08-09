-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "LabourWageType" AS ENUM ('DAILY', 'CONTRACT', 'PIECE_RATE');

-- CreateEnum
CREATE TYPE "FertilizerType" AS ENUM ('ORGANIC', 'CHEMICAL', 'BIO');

-- CreateEnum
CREATE TYPE "SprayType" AS ENUM ('PESTICIDE', 'FUNGICIDE', 'HERBICIDE', 'INSECTICIDE', 'GROWTH_REGULATOR', 'OTHER');

-- CreateEnum
CREATE TYPE "SprayScheduleStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "CropProblemSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CropProblemStatus" AS ENUM ('REPORTED', 'UNDER_REVIEW', 'ADVISOR_RESPONDED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('SEED', 'FERTILIZER', 'PESTICIDE', 'PRODUCE', 'EQUIPMENT_PART', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'WASTAGE');

-- CreateEnum
CREATE TYPE "MachineryOwnership" AS ENUM ('OWNED', 'RENTED');

-- CreateEnum
CREATE TYPE "AdvisorAssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SPRAY_REMINDER', 'PAYMENT_DUE', 'ADVISOR_MESSAGE', 'CROP_PROBLEM_UPDATE', 'MARKET_RATE_ALERT', 'SYSTEM');

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelHi" TEXT NOT NULL,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "plotId" TEXT,
    "cropCycleId" TEXT,
    "categoryId" TEXT NOT NULL,
    "machineryId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "paymentMode" "PaymentMode",
    "vendorName" TEXT,
    "description" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "receiptPhotoUrl" TEXT,
    "recordedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "village" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "plotId" TEXT,
    "cropCycleId" TEXT,
    "customerId" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentMode" "PaymentMode",
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "saleId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMode" "PaymentMode",
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labour_workers" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "defaultDailyWage" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "labour_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labour_entries" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "plotId" TEXT,
    "cropCycleId" TEXT,
    "workerId" TEXT,
    "workerCount" INTEGER NOT NULL DEFAULT 1,
    "workType" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "wageType" "LabourWageType" NOT NULL,
    "wageAmount" DECIMAL(12,2) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "labour_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fertilizers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FertilizerType",
    "defaultUnit" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "addedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fertilizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fertilizer_usage" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "fertilizerId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "applicationMethod" TEXT,
    "expenseId" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fertilizer_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprays" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "sprayType" "SprayType" NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "sprayDate" TIMESTAMP(3) NOT NULL,
    "doneById" TEXT,
    "expenseId" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sprays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spray_schedules" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "sprayType" "SprayType",
    "recommendedProduct" TEXT,
    "dosageInstructions" TEXT,
    "alternativeOption" TEXT,
    "createdByAdvisorId" TEXT NOT NULL,
    "status" "SprayScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "completedSprayId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "spray_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_problems" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "CropProblemSeverity",
    "status" "CropProblemStatus" NOT NULL DEFAULT 'REPORTED',
    "assignedAdvisorId" TEXT,
    "advisorResponse" TEXT,
    "recommendedProduct" TEXT,
    "followUpDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "crop_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_problem_photos" (
    "id" TEXT NOT NULL,
    "cropProblemId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_problem_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvests" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "totalQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "wasteQuantity" DOUBLE PRECISION,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "harvests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_grade_breakdowns" (
    "id" TEXT NOT NULL,
    "harvestId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_grade_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "unit" TEXT NOT NULL,
    "currentQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lowStockThreshold" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "transactionType" "InventoryTransactionType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "relatedCropCycleId" TEXT,
    "relatedExpenseId" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machinery" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownership" "MachineryOwnership" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "machinery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "irrigation_records" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "irrigationDate" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "durationMinutes" INTEGER,
    "waterSource" TEXT,
    "expenseId" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "irrigation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_assignments" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "status" "AdvisorAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedById" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "advisor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_rates" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "variety" TEXT,
    "market" TEXT NOT NULL,
    "state" TEXT,
    "district" TEXT,
    "minPrice" DECIMAL(12,2),
    "maxPrice" DECIMAL(12,2),
    "modalPrice" DECIMAL(12,2),
    "unit" TEXT NOT NULL DEFAULT 'quintal',
    "rateDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_key_key" ON "expense_categories"("key");

-- CreateIndex
CREATE INDEX "expenses_farmId_idx" ON "expenses"("farmId");

-- CreateIndex
CREATE INDEX "expenses_plotId_idx" ON "expenses"("plotId");

-- CreateIndex
CREATE INDEX "expenses_cropCycleId_idx" ON "expenses"("cropCycleId");

-- CreateIndex
CREATE INDEX "expenses_categoryId_idx" ON "expenses"("categoryId");

-- CreateIndex
CREATE INDEX "expenses_machineryId_idx" ON "expenses"("machineryId");

-- CreateIndex
CREATE INDEX "customers_farmerId_idx" ON "customers"("farmerId");

-- CreateIndex
CREATE INDEX "sales_farmId_idx" ON "sales"("farmId");

-- CreateIndex
CREATE INDEX "sales_plotId_idx" ON "sales"("plotId");

-- CreateIndex
CREATE INDEX "sales_cropCycleId_idx" ON "sales"("cropCycleId");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "payments_customerId_idx" ON "payments"("customerId");

-- CreateIndex
CREATE INDEX "payments_saleId_idx" ON "payments"("saleId");

-- CreateIndex
CREATE INDEX "labour_workers_farmId_idx" ON "labour_workers"("farmId");

-- CreateIndex
CREATE INDEX "labour_entries_farmId_idx" ON "labour_entries"("farmId");

-- CreateIndex
CREATE INDEX "labour_entries_plotId_idx" ON "labour_entries"("plotId");

-- CreateIndex
CREATE INDEX "labour_entries_cropCycleId_idx" ON "labour_entries"("cropCycleId");

-- CreateIndex
CREATE INDEX "labour_entries_workerId_idx" ON "labour_entries"("workerId");

-- CreateIndex
CREATE INDEX "fertilizer_usage_cropCycleId_idx" ON "fertilizer_usage"("cropCycleId");

-- CreateIndex
CREATE INDEX "fertilizer_usage_fertilizerId_idx" ON "fertilizer_usage"("fertilizerId");

-- CreateIndex
CREATE INDEX "fertilizer_usage_expenseId_idx" ON "fertilizer_usage"("expenseId");

-- CreateIndex
CREATE INDEX "sprays_cropCycleId_idx" ON "sprays"("cropCycleId");

-- CreateIndex
CREATE INDEX "sprays_expenseId_idx" ON "sprays"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "spray_schedules_completedSprayId_key" ON "spray_schedules"("completedSprayId");

-- CreateIndex
CREATE INDEX "spray_schedules_cropCycleId_idx" ON "spray_schedules"("cropCycleId");

-- CreateIndex
CREATE INDEX "spray_schedules_createdByAdvisorId_idx" ON "spray_schedules"("createdByAdvisorId");

-- CreateIndex
CREATE INDEX "crop_problems_cropCycleId_idx" ON "crop_problems"("cropCycleId");

-- CreateIndex
CREATE INDEX "crop_problems_assignedAdvisorId_idx" ON "crop_problems"("assignedAdvisorId");

-- CreateIndex
CREATE INDEX "crop_problem_photos_cropProblemId_idx" ON "crop_problem_photos"("cropProblemId");

-- CreateIndex
CREATE INDEX "harvests_cropCycleId_idx" ON "harvests"("cropCycleId");

-- CreateIndex
CREATE INDEX "harvest_grade_breakdowns_harvestId_idx" ON "harvest_grade_breakdowns"("harvestId");

-- CreateIndex
CREATE INDEX "inventory_items_farmId_idx" ON "inventory_items"("farmId");

-- CreateIndex
CREATE INDEX "inventory_transactions_inventoryItemId_idx" ON "inventory_transactions"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_transactions_relatedCropCycleId_idx" ON "inventory_transactions"("relatedCropCycleId");

-- CreateIndex
CREATE INDEX "inventory_transactions_relatedExpenseId_idx" ON "inventory_transactions"("relatedExpenseId");

-- CreateIndex
CREATE INDEX "machinery_farmId_idx" ON "machinery"("farmId");

-- CreateIndex
CREATE INDEX "irrigation_records_plotId_idx" ON "irrigation_records"("plotId");

-- CreateIndex
CREATE INDEX "irrigation_records_cropCycleId_idx" ON "irrigation_records"("cropCycleId");

-- CreateIndex
CREATE INDEX "irrigation_records_expenseId_idx" ON "irrigation_records"("expenseId");

-- CreateIndex
CREATE INDEX "advisor_assignments_advisorId_idx" ON "advisor_assignments"("advisorId");

-- CreateIndex
CREATE INDEX "advisor_assignments_farmerId_idx" ON "advisor_assignments"("farmerId");

-- CreateIndex
CREATE INDEX "market_rates_cropName_rateDate_idx" ON "market_rates"("cropName", "rateDate");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_machineryId_fkey" FOREIGN KEY ("machineryId") REFERENCES "machinery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_workers" ADD CONSTRAINT "labour_workers_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_entries" ADD CONSTRAINT "labour_entries_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_entries" ADD CONSTRAINT "labour_entries_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_entries" ADD CONSTRAINT "labour_entries_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_entries" ADD CONSTRAINT "labour_entries_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "labour_workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_entries" ADD CONSTRAINT "labour_entries_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizers" ADD CONSTRAINT "fertilizers_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_usage" ADD CONSTRAINT "fertilizer_usage_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_usage" ADD CONSTRAINT "fertilizer_usage_fertilizerId_fkey" FOREIGN KEY ("fertilizerId") REFERENCES "fertilizers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_usage" ADD CONSTRAINT "fertilizer_usage_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_usage" ADD CONSTRAINT "fertilizer_usage_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprays" ADD CONSTRAINT "sprays_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprays" ADD CONSTRAINT "sprays_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "labour_workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprays" ADD CONSTRAINT "sprays_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprays" ADD CONSTRAINT "sprays_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spray_schedules" ADD CONSTRAINT "spray_schedules_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spray_schedules" ADD CONSTRAINT "spray_schedules_createdByAdvisorId_fkey" FOREIGN KEY ("createdByAdvisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spray_schedules" ADD CONSTRAINT "spray_schedules_completedSprayId_fkey" FOREIGN KEY ("completedSprayId") REFERENCES "sprays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_problems" ADD CONSTRAINT "crop_problems_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_problems" ADD CONSTRAINT "crop_problems_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_problems" ADD CONSTRAINT "crop_problems_assignedAdvisorId_fkey" FOREIGN KEY ("assignedAdvisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_problem_photos" ADD CONSTRAINT "crop_problem_photos_cropProblemId_fkey" FOREIGN KEY ("cropProblemId") REFERENCES "crop_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_grade_breakdowns" ADD CONSTRAINT "harvest_grade_breakdowns_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "harvests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_relatedCropCycleId_fkey" FOREIGN KEY ("relatedCropCycleId") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_relatedExpenseId_fkey" FOREIGN KEY ("relatedExpenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_records" ADD CONSTRAINT "irrigation_records_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_records" ADD CONSTRAINT "irrigation_records_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_records" ADD CONSTRAINT "irrigation_records_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_records" ADD CONSTRAINT "irrigation_records_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_assignments" ADD CONSTRAINT "advisor_assignments_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_assignments" ADD CONSTRAINT "advisor_assignments_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_assignments" ADD CONSTRAINT "advisor_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
