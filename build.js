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

console.log(`🚀 Starting Expo Web build in resolved directory: ${targetDir}`);

process.env.CI = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';

try {
  console.log('📦 Running npm install...');
  execSync('npm install --legacy-peer-deps', { cwd: targetDir, stdio: 'inherit' });

  console.log('⚡ Running Expo Export...');
  execSync('npx expo export -p web', { cwd: targetDir, env: { ...process.env, EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1', CI: '1' }, stdio: 'inherit' });

  console.log('✅ Expo Web build completed successfully!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
