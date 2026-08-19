-- Numbered payment receipt snapshots, so a past payment (Receive/Pay Amount) can be re-shared exactly as recorded.
CREATE TABLE "payment_receipts" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "isReceived" BOOLEAN NOT NULL,
    "previousBalance" DECIMAL(12,2) NOT NULL,
    "paymentAmount" DECIMAL(12,2) NOT NULL,
    "netBalance" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_receipts_farmerId_idx" ON "payment_receipts"("farmerId");

ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "party_ledger_entries" ADD COLUMN "paymentReceiptId" TEXT;

CREATE INDEX "party_ledger_entries_paymentReceiptId_idx" ON "party_ledger_entries"("paymentReceiptId");

ALTER TABLE "party_ledger_entries" ADD CONSTRAINT "party_ledger_entries_paymentReceiptId_fkey" FOREIGN KEY ("paymentReceiptId") REFERENCES "payment_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
