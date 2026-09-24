@echo off
echo 🚀 Starting Build and Deployment to GitHub and Hostinger...
node frontend/build.js
git add .
git commit -m "feat: automatic live update release"
git push origin main
git push hostinger main
echo ✅ All done! Deployed to Hostinger live server.
pause
