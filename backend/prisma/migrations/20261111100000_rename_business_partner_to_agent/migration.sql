DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'BUSINESS_PARTNER'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'AGENT'
  ) THEN
    ALTER TYPE "Role" RENAME VALUE 'BUSINESS_PARTNER' TO 'AGENT';
  END IF;
END $$;

