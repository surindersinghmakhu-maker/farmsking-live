-- CreateTable
CREATE TABLE "spray_item_templates" (
  "id" TEXT NOT NULL,
  "advisorId" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "dose" TEXT,
  "alternative1" TEXT,
  "alternative2" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "spray_item_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spray_item_templates_advisorId_idx" ON "spray_item_templates"("advisorId");

-- AddForeignKey
ALTER TABLE "spray_item_templates" ADD CONSTRAINT "spray_item_templates_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
