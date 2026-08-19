-- AlterTable
ALTER TABLE "crop_cycles" ADD COLUMN "cropId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "crop_cycles_cropId_key" ON "crop_cycles"("cropId");
