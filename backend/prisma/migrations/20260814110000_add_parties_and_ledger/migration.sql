-- Adds a shared "Party" (buyer/trader/vendor) directory plus a signed running ledger,
-- used by both the farmer's Sales (receivable) and Expenses (payable) flows.
ALTER TYPE "PaymentMode" ADD VALUE 'CREDIT';

-- CreateEnum
CREATE TYPE "PartyLedgerEntryType" AS ENUM ('SALE_CREDIT', 'SALE_PAYMENT', 'EXPENSE_CREDIT', 'EXPENSE_PAYMENT');

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "parties_ownerId_idx" ON "parties"("ownerId");

ALTER TABLE "parties" ADD CONSTRAINT "parties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "party_ledger_entries" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "type" "PartyLedgerEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "party_ledger_entries_partyId_idx" ON "party_ledger_entries"("partyId");

ALTER TABLE "party_ledger_entries" ADD CONSTRAINT "party_ledger_entries_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "party_ledger_entries" ADD CONSTRAINT "party_ledger_entries_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "partyId" TEXT;

CREATE INDEX "expenses_partyId_idx" ON "expenses"("partyId");

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
