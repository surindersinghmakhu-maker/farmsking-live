const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define root and backup directories
const rootDir = path.resolve(__dirname, '..');
const backupsRootDir = path.join(rootDir, 'backups');

// Folders/files to IGNORE to keep backup lightweight
const IGNORED = new Set([
  'node_modules',
  '.expo',
  'dist',
  'web-build',
  '.git',
  '.vscode',
  'backups',
  'scratch',
  'reports',
  'videos',
  'coverage',
  '.next',
]);

const SENSITIVE_REGEX = /^(?!\.env\.example$)(?:\.env(?:\..*)?|.*\.jks|.*\.p8|.*\.p12|.*\.key|.*\.mobileprovision|.*\.pem)$/i;

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${mins}${secs}`;
}

function copyFolderRecursive(src, dest) {
  const baseName = path.basename(src);
  if (IGNORED.has(baseName)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    if (entry.isFile() && SENSITIVE_REGEX.test(entry.name)) {
      console.log(`Skipping sensitive file: ${entry.name}`);
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('📦 Creating clean lightweight backup...');
  const timestamp = getTimestamp();
  const backupFolderName = `farmsking_${timestamp}`;
  const targetBackupDir = path.join(backupsRootDir, backupFolderName);

  // Copy clean source files
  copyFolderRecursive(rootDir, targetBackupDir);

  console.log(`✅ Clean source backup created at:`);
  console.log(`📂 ${targetBackupDir}`);

  // Try creating ZIP file using PowerShell Compress-Archive
  const zipPath = path.join(backupsRootDir, `${backupFolderName}.zip`);
  console.log(`🤐 Compressing into single ZIP file...`);
  
  const psCmd = `powershell -Command "Compress-Archive -Path '${targetBackupDir}\\*' -DestinationPath '${zipPath}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  // Remove uncompressed temporary folder after zipping
  if (fs.existsSync(zipPath)) {
    fs.rmSync(targetBackupDir, { recursive: true, force: true });
    console.log(`🎉 Backup completed successfully!`);
    console.log(`📦 Zip file: ${zipPath}`);
  }

} catch (err) {
  console.error('❌ Backup failed:', err.message);
}
