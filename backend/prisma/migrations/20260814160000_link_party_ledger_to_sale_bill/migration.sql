-- Link a SALE_CREDIT ledger entry back to the SaleBill it was created from, so the real saved bill
-- (with its item breakdown) can be re-shared from the Party Statement instead of a reconstructed guess.
ALTER TABLE "party_ledger_entries" ADD COLUMN "saleBillId" TEXT;

CREATE INDEX "party_ledger_entries_saleBillId_idx" ON "party_ledger_entries"("saleBillId");

ALTER TABLE "party_ledger_entries" ADD CONSTRAINT "party_ledger_entries_saleBillId_fkey" FOREIGN KEY ("saleBillId") REFERENCES "sale_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
