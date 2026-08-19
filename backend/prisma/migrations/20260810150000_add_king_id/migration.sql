-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_kingId_key" ON "users"("kingId");
