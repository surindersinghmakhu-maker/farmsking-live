-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "weatherAlertMinTempC" DOUBLE PRECISION,
  ADD COLUMN "weatherAlertMaxTempC" DOUBLE PRECISION,
  ADD COLUMN "weatherAlertRainEnabled" BOOLEAN NOT NULL DEFAULT false;
