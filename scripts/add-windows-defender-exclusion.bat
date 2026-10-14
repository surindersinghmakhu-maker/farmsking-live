@echo off
:: Batch script to add FarmsKing project folder to Windows Defender Exclusions
:: This stops Windows Defender from scanning node_modules, saving 30-50% CPU during builds.
echo ====================================================
echo  FarmsKing: Adding Windows Defender Folder Exclusion
echo ====================================================
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Administrator permission required.
    echo Please right-click this file and select "Run as administrator".
    pause
    exit /b 1
)

powershell -Command "Add-MpPreference -ExclusionPath 'D:\FarmsKing'"
if %errorLevel% equ 0 (
    echo [OK] Successfully added D:\FarmsKing to Windows Defender exclusions!
    echo Your builds and IDE will now run much faster with lower CPU usage.
) else (
    echo [ERROR] Failed to add exclusion.
)
pause
