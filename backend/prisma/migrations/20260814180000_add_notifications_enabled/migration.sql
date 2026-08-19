-- Per-user push-notification on/off preference, defaulting everyone to enabled.
ALTER TABLE "users" ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
