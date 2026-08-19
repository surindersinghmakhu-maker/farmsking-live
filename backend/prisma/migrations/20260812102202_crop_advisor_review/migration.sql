-- CreateEnum
CREATE TYPE "CropAdvisorReviewStatus" AS ENUM ('NONE', 'PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "crop_cycles" ADD COLUMN     "advisorAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "advisorReviewStatus" "CropAdvisorReviewStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "submittedToAdvisorAt" TIMESTAMP(3);

