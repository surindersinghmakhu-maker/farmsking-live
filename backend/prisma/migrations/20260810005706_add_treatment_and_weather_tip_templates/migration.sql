-- CreateEnum
CREATE TYPE "WeatherTipTrigger" AS ENUM ('HIGH_TEMPERATURE', 'RAIN', 'COLD');

-- CreateTable
CREATE TABLE "treatment_templates" (
    "id" TEXT NOT NULL,
    "problemTitle" TEXT NOT NULL,
    "cropCategory" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_template_tasks" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "treatmentName" TEXT NOT NULL,

    CONSTRAINT "treatment_template_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_tip_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggerType" "WeatherTipTrigger" NOT NULL,
    "thresholdC" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_tip_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treatment_template_tasks_templateId_idx" ON "treatment_template_tasks"("templateId");

-- AddForeignKey
ALTER TABLE "treatment_templates" ADD CONSTRAINT "treatment_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_template_tasks" ADD CONSTRAINT "treatment_template_tasks_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "treatment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_tip_templates" ADD CONSTRAINT "weather_tip_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
