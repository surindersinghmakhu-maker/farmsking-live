const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = fs.existsSync(path.join(__dirname, 'frontend'))
  ? path.join(__dirname, 'frontend')
  : __dirname;

console.log(`🚀 Starting Expo Web build in directory: ${frontendDir}`);

process.env.CI = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

try {
  console.log('📦 Running npm install...');
  execSync('npm install --legacy-peer-deps', { cwd: frontendDir, stdio: 'inherit' });

  console.log('⚡ Running Expo Export...');
  execSync('npx expo export -p web', { cwd: frontendDir, stdio: 'inherit' });

  console.log('✅ Expo Web build completed successfully!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
