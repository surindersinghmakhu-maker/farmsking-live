const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Walk up parent directories to locate frontend package.json
let currentDir = __dirname;
let targetDir = currentDir;

while (currentDir !== path.parse(currentDir).root) {
  if (fs.existsSync(path.join(currentDir, 'frontend', 'package.json'))) {
    targetDir = path.join(currentDir, 'frontend');
    break;
  }
  if (fs.existsSync(path.join(currentDir, 'package.json')) && (fs.existsSync(path.join(currentDir, 'app')) || fs.existsSync(path.join(currentDir, 'src')))) {
    targetDir = currentDir;
    break;
  }
  currentDir = path.dirname(currentDir);
}

// Trigger automatic version bump
try {
  const bumpScriptPath = path.join(currentDir, 'scripts', 'bump-version.js');
  if (fs.existsSync(bumpScriptPath)) {
    const { runVersionBump } = require(bumpScriptPath);
    runVersionBump();
  }
} catch (bumpErr) {
  console.warn('⚠️ Auto version bump skipped:', bumpErr.message);
}

console.log(`🚀 Starting Expo Web build in resolved directory: ${targetDir}`);

process.env.CI = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';

try {
  console.log('📦 Running npm install...');
  execSync('npm install --legacy-peer-deps', { cwd: targetDir, stdio: 'inherit' });

  console.log('⚡ Running Expo Export...');
  execSync('npx expo export -p web', { cwd: targetDir, env: { ...process.env, EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1', CI: '1' }, stdio: 'inherit' });

  const publicDir = path.join(targetDir, 'public');
  const distDir = path.join(targetDir, 'dist');
  if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
    console.log('📂 Copying static assets from public to dist...');
    fs.cpSync(publicDir, distDir, { recursive: true });
  }

  const distIndexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndexPath)) {
    let indexHtml = fs.readFileSync(distIndexPath, 'utf8');
    const metaCacheHeaders = `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" /><meta http-equiv="Pragma" content="no-cache" /><meta http-equiv="Expires" content="0" />`;
    indexHtml = indexHtml.replace('<head>', `<head>${metaCacheHeaders}`);
    fs.writeFileSync(distIndexPath, indexHtml, 'utf8');
  }

  console.log('✅ Expo Web build completed successfully!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
