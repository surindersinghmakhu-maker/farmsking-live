-- Every account can now hold more than one granted role (e.g. Farmer + Business Partner). `role` stays
-- the current/primary dashboard; `roles` accumulates every role ever granted to the account.
ALTER TABLE "users" ADD COLUMN "roles" "Role"[] NOT NULL DEFAULT ARRAY[]::"Role"[];

-- Backfill: every existing account's roles list starts with just their current role.
UPDATE "users" SET "roles" = ARRAY["role"];
