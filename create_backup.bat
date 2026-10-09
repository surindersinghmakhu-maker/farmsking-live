@echo off
title FarmsKing - Instant Lightweight Source Backup
color 0A
echo =======================================================
echo 📦 FarmsKing Instant Project Source Backup Generator
echo =======================================================
echo.
echo Cleaning temporary files and zipping source code...
node scripts/backup.js
echo.
echo =======================================================
echo ✅ Backup complete! Saved inside d:\FarmsKing\backups\
echo =======================================================
pause
