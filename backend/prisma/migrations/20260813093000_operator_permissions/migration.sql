-- Fixed set of read-only capabilities an Admin/Super Admin can grant to a specific Operator account.
CREATE TYPE "OperatorPermission" AS ENUM ('VIEW_ORDERS', 'VIEW_COUPONS', 'VIEW_USERS', 'VIEW_WALLETS', 'VIEW_FARMER_PLANS');

ALTER TABLE "users" ADD COLUMN "operatorPermissions" "OperatorPermission"[] NOT NULL DEFAULT ARRAY[]::"OperatorPermission"[];
