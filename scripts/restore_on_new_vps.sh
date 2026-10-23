#!/usr/bin/env bash
set -e

echo "=== 1. Setting up PostgreSQL User and Database ==="
sudo -u postgres psql << 'SQL'
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'farmsking') THEN
      CREATE USER farmsking WITH ENCRYPTED PASSWORD 'FarmsKing2026SecurePass' CREATEDB SUPERUSER;
   END IF;
END
$$;
SQL

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'farmsking_db'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE farmsking_db OWNER farmsking;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE farmsking_db TO farmsking;"

echo "=== 2. Restoring PostgreSQL Dump ==="
if [ -f /tmp/farmsking_live.dump ]; then
    echo "Restoring from /tmp/farmsking_live.dump..."
    sudo -u postgres pg_restore -d farmsking_db --clean --if-exists --no-owner --role=farmsking /tmp/farmsking_live.dump || true
else
    echo "Dump file not found at /tmp/farmsking_live.dump"
    exit 1
fi

echo "=== 3. Verifying Database Restore ==="
sudo -u postgres psql -d farmsking_db -c "SELECT count(*) AS total_users FROM \"User\";"
sudo -u postgres psql -d farmsking_db -c "SELECT count(*) AS total_products FROM \"Product\";"

echo "=== 4. Extracting Uploads ==="
mkdir -p /var/www/farmsking-live/backend
if [ -f /tmp/uploads.tar.gz ]; then
    tar -xzf /tmp/uploads.tar.gz -C /var/www/farmsking-live/backend/
    echo "Uploads extracted to /var/www/farmsking-live/backend/uploads"
    ls -lh /var/www/farmsking-live/backend/uploads | head -n 5
fi

echo "=== SCRIPT COMPLETE ==="
