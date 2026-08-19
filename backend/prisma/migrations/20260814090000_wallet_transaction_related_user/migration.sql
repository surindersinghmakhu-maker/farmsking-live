-- Adds an optional "relatedUserId" to wallet_transactions, pointing at the farmer whose action
-- (e.g. a plan coupon redemption) triggered the credit/debit — lets a wallet owner see exactly
-- which farmer a transaction was tied to via a "Full Details" view.
ALTER TABLE "wallet_transactions" ADD COLUMN "relatedUserId" TEXT;

CREATE INDEX "wallet_transactions_relatedUserId_idx" ON "wallet_transactions"("relatedUserId");

ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
