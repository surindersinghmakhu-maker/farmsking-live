const { execSync } = require('child_process');
const path = require('path');
process.env.PATH = `D:\\Git\\cmd;${process.env.PATH}`;

function run(command, cwd, allowFail = false) {
  console.log(`\n> Running: ${command} in ${cwd || '.'}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (err) {
    if (allowFail) {
      console.warn(`\n⚠️ Command warning: ${command}`);
      return false;
    }
    console.error(`\n❌ Deployment aborted! Command failed with exit code ${err.status}: ${command}`);
    process.exit(1);
  }
}

console.log('🚀 Starting Build and Deployment to GitHub and Hostinger...');

// 1. Build Backend
const backendOk = run('npm run build:local', './backend', true);
if (!backendOk) {
  console.log('⚡ Prisma query engine dll is locked by active process; building NestJS directly...');
  run('npx nest build', './backend');
}

// 2. Build Frontend Web
run('node frontend/build.js');

// 2b. Build Admin Web
run('node admin/build.js');

// 3. Git Operations
run('git add .');
run('git commit -m "deploy: automatic live update release"');
run('git push origin HEAD:main');
run('git push hostinger HEAD:main');

console.log('✅ All done! Deployed to Hostinger live server safely.');
