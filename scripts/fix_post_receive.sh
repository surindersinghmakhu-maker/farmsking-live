#!/bin/bash
cat << 'EOF' > /var/repo/farmsking.git/hooks/post-receive
#!/bin/bash
echo '🚀 Hostinger Deployment Started...'
TARGET="/var/www/farmsking-live"
GIT_DIR="/var/repo/farmsking.git"

git --work-tree="$TARGET" --git-dir="$GIT_DIR" checkout -f main

echo '📦 Updating Backend...'
cd "$TARGET/backend" || exit 1
npm install --legacy-peer-deps --silent
npx prisma generate >/dev/null 2>&1 || true
pm2 restart farmsking-backend || pm2 start dist/main.js --name farmsking-backend

echo '⚡ Syncing Pre-built Frontend & Admin Web Dist...'
systemctl restart nginx
echo '✅ Hostinger VPS Deployed Successfully!'
EOF

chmod +x /var/repo/farmsking.git/hooks/post-receive
echo "Post-receive hook fixed!"
