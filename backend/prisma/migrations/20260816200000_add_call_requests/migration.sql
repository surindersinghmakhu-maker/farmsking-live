-- CreateEnum
CREATE TYPE "CallRequestStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateTable
CREATE TABLE "call_requests" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "status" "CallRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedComment" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_requests_advisorId_idx" ON "call_requests"("advisorId");

-- CreateIndex
CREATE INDEX "call_requests_farmerId_idx" ON "call_requests"("farmerId");

-- AddForeignKey
ALTER TABLE "call_requests" ADD CONSTRAINT "call_requests_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_requests" ADD CONSTRAINT "call_requests_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
