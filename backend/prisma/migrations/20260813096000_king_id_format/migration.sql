-- King IDs move from "FK-XXXXXXXX" (hex) to "FKNNNNNN" (6 digits). Regenerate every existing one to the new format.
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
BEGIN
  FOR r IN SELECT id FROM "users" WHERE "kingId" IS NOT NULL LOOP
    LOOP
      new_id := 'FK' || lpad((floor(random() * 1000000))::text, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "users" WHERE "kingId" = new_id);
    END LOOP;
    UPDATE "users" SET "kingId" = new_id WHERE id = r.id;
  END LOOP;
END $$;
