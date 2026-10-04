#!/bin/bash
cd /var/www/farmsking-live/backend
export $(cat .env | xargs)
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > /tmp/db-diff.sql
sudo -u postgres psql -d farmsking_db -f /tmp/db-diff.sql
pm2 restart farmsking-backend
