const { execSync } = require('child_process');

function run(command, cwd) {
  console.log(`\n> Running: ${command} in ${cwd || '.'}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (err) {
    console.error(`\n❌ Deployment aborted! Command failed with exit code ${err.status}: ${command}`);
    process.exit(1);
  }
}

console.log('🚀 Starting Build and Deployment to GitHub and Hostinger...');

// 1. Build Backend
run('npm run build:local', './backend');

// 2. Build Frontend Web
run('node frontend/build.js');

// 2b. Build Admin Web
run('node admin/build.js');

// 3. Git Operations
run('git add .');
run('git commit -m "deploy: automatic live update release"');
run('git push origin main');
run('git push hostinger main');

console.log('✅ All done! Deployed to Hostinger live server safely.');
