const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(command, cwd) {
  console.log(`\n> Running: ${command} in ${cwd || '.'}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (err) {
    console.error(`\n❌ Command failed with exit code ${err.status}: ${command}`);
    process.exit(1);
  }
}

const shouldInstall = process.argv.includes('--install') || !fs.existsSync(path.join(__dirname, '..', 'backend', 'node_modules'));
if (shouldInstall) {
  run('npm install --legacy-peer-deps', './backend');
} else {
  console.log('\n✅ Backend node_modules already exists. Skipping npm install (use --install to re-install)');
}

run('npm run build:local', './backend');
