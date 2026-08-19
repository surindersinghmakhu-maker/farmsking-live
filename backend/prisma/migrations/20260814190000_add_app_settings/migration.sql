-- Singleton, Super-Admin-editable app settings — currently just the UPI ID used for order/plan payments.
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "upiId" TEXT,
    "upiPayeeName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "app_settings" ("id", "upiId", "upiPayeeName", "updatedAt") VALUES ('default', 'surindersinghmakhu-8@okicici', 'FarmsKing', CURRENT_TIMESTAMP);
