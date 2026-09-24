const fs = require('fs');
const path = require('path');

function bumpVersionString(ver) {
  const parts = (ver || '1.0.0').split('.');
  let major = parseInt(parts[0], 10) || 1;
  let minor = parseInt(parts[1], 10) || 0;
  let patch = parseInt(parts[2], 10) || 0;

  patch += 1;
  if (patch > 99) {
    minor += 1;
    patch = 0;
  }

  return `${major}.${minor}.${patch}`;
}

function runVersionBump() {
  const rootDir = path.resolve(__dirname, '..');
  const frontendDir = path.join(rootDir, 'frontend');

  const appJsonPath = path.join(frontendDir, 'app.json');
  const frontendPkgPath = path.join(frontendDir, 'package.json');
  const rootPkgPath = path.join(rootDir, 'package.json');
  const versionTsPath = path.join(frontendDir, 'src', 'constants', 'version.ts');

  let currentVersion = '1.0.0';

  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    currentVersion = appJson.expo?.version || '1.0.0';
  } else if (fs.existsSync(frontendPkgPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
    currentVersion = pkgJson.version || '1.0.0';
  }

  const newVersion = bumpVersionString(currentVersion);
  console.log(`🏷️ Bumping App Version: ${currentVersion} ➔ ${newVersion}`);

  // Update frontend/app.json
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    if (!appJson.expo) appJson.expo = {};
    appJson.expo.version = newVersion;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
  }

  // Update frontend/package.json
  if (fs.existsSync(frontendPkgPath)) {
    const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
    frontendPkg.version = newVersion;
    fs.writeFileSync(frontendPkgPath, JSON.stringify(frontendPkg, null, 2) + '\n', 'utf8');
  }

  // Update root package.json
  if (fs.existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    rootPkg.version = newVersion;
    fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
  }

  // Ensure src/constants directory exists
  const constantsDir = path.dirname(versionTsPath);
  if (!fs.existsSync(constantsDir)) {
    fs.mkdirSync(constantsDir, { recursive: true });
  }

  // Write src/constants/version.ts
  const versionTsContent = `// Auto-generated build version file\nexport const APP_VERSION = '${newVersion}';\n`;
  fs.writeFileSync(versionTsPath, versionTsContent, 'utf8');

  console.log(`✅ Version bump complete. Current Version: ${newVersion}`);
  return newVersion;
}

if (require.main === module) {
  runVersionBump();
}

module.exports = { bumpVersionString, runVersionBump };
