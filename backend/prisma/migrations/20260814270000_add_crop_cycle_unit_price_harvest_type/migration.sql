-- CreateEnum
CREATE TYPE "CropHarvestType" AS ENUM ('ONE_TIME', 'CONTINUOUS');

-- CreateEnum
CREATE TYPE "CropCycleStage" AS ENUM ('PLANTATION', 'VEGETATIVE', 'FLOWERING', 'HARVESTING', 'COMPLETED');

-- AlterTable
ALTER TABLE "crop_cycles"
  ADD COLUMN "unit" TEXT,
  ADD COLUMN "pricePerUnit" DECIMAL(10,2),
  ADD COLUMN "harvestType" "CropHarvestType" NOT NULL DEFAULT 'CONTINUOUS',
  ADD COLUMN "stage" "CropCycleStage" NOT NULL DEFAULT 'PLANTATION';
