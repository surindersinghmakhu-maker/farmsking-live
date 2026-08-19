-- Lets an Admin deactivate a role on a user's account without ever deleting it from `roles` history.
ALTER TABLE "users" ADD COLUMN "deactivatedRoles" "Role"[] NOT NULL DEFAULT ARRAY[]::"Role"[];
