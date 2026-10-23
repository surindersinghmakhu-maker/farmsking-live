#!/usr/bin/env bash
set -e

echo "=== 1. Restoring SSL Certificates ==="
if [ -f /tmp/ssl_certs.tar.gz ]; then
    tar -xzf /tmp/ssl_certs.tar.gz -C /etc/
    echo "SSL certificates restored into /etc/letsencrypt"
    ls -la /etc/letsencrypt/live || true
fi

echo "=== 2. Building Backend ==="
cd /var/www/farmsking-live/backend
npm install
npx prisma generate
npm run build

echo "=== 3. Starting PM2 Process ==="
pm2 delete farmsking-backend || true
pm2 start dist/main.js --name "farmsking-backend"
pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true

echo "=== 4. Health Check ==="
sleep 4
curl -I http://127.0.0.1:3000 || true

echo "=== BACKEND IS UP AND RUNNING! ==="
