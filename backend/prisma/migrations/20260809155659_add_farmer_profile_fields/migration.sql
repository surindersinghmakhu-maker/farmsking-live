-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('ALLUVIAL', 'BLACK', 'RED', 'LATERITE', 'SANDY', 'CLAY', 'LOAMY', 'SALINE_ALKALINE');

-- CreateEnum
CREATE TYPE "WaterType" AS ENUM ('BOREWELL_TUBEWELL', 'CANAL', 'RIVER', 'POND_LAKE', 'RAINFED', 'TAP_MUNICIPAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "soilType" "SoilType",
ADD COLUMN     "sprayTankSizeL" INTEGER,
ADD COLUMN     "waterType" "WaterType";
