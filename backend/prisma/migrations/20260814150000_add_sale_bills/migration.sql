-- Per-sale bill snapshots for the Farmer Accounts screen, so a past sale's bill can be regenerated/shared later.
CREATE TABLE "sale_bills" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "partyId" TEXT,
    "partyName" TEXT NOT NULL,
    "isCash" BOOLEAN NOT NULL,
    "items" JSONB NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "amountReceived" DECIMAL(12,2) NOT NULL,
    "thisSaleBalance" DECIMAL(12,2) NOT NULL,
    "previousBalance" DECIMAL(12,2) NOT NULL,
    "netReceivable" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_bills_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sale_bills_farmerId_idx" ON "sale_bills"("farmerId");

ALTER TABLE "sale_bills" ADD CONSTRAINT "sale_bills_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
