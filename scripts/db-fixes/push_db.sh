#!/bin/bash
cd /var/www/farmsking-live/backend
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/farmsking_db?schema=public"
npx prisma db push --accept-data-loss
sudo -u postgres psql -d farmsking_db -c "FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'ALTER TABLE ' || t.tablename || ' OWNER TO farmsking;'; END LOOP;"
pm2 restart farmsking-backend
