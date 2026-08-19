-- King IDs move from "FKNNNNNN" (FK + 6 digits) to a plain 8-digit number, no prefix. Regenerate every existing one.
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
BEGIN
  FOR r IN SELECT id FROM "users" WHERE "kingId" IS NOT NULL LOOP
    LOOP
      new_id := lpad((floor(random() * 100000000))::text, 8, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "users" WHERE "kingId" = new_id);
    END LOOP;
    UPDATE "users" SET "kingId" = new_id WHERE id = r.id;
  END LOOP;
END $$;
