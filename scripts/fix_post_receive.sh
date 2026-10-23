#!/bin/bash
cat << 'EOF' > /var/repo/farmsking.git/hooks/post-receive
#!/bin/bash
echo '🚀 Hostinger Deployment Started...'
TARGET="/var/www/farmsking-live"
GIT_DIR="/var/repo/farmsking.git"

git --work-tree="$TARGET" --git-dir="$GIT_DIR" checkout -f main

echo '📦 Building Backend...'
cd "$TARGET/backend" || exit 1
npm install --legacy-peer-deps --silent
npx prisma generate >/dev/null 2>&1 || true
npm run build
pm2 restart farmsking-backend || pm2 start dist/main.js --name farmsking-backend

echo '⚡ Building Frontend Expo Web...'
cd "$TARGET/frontend" || exit 1
npm install --legacy-peer-deps --silent
CI=1 EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1 NODE_OPTIONS='--max-old-space-size=4096' npx expo export -p web

systemctl restart nginx
echo '✅ Hostinger VPS Deployed Successfully!'
EOF

chmod +x /var/repo/farmsking.git/hooks/post-receive
echo "Post-receive hook fixed!"
