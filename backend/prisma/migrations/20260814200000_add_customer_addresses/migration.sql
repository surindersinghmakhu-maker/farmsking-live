-- Saved delivery addresses for the shopping/orders flow — picked at checkout instead of retyping each time.
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "postOffice" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_addresses_ownerId_idx" ON "customer_addresses"("ownerId");

ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
