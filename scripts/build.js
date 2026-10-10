const { execSync } = require('child_process');

function run(command, cwd) {
  console.log(`\n> Running: ${command} in ${cwd || '.'}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (err) {
    console.error(`\n❌ Command failed with exit code ${err.status}: ${command}`);
    process.exit(1);
  }
}

run('npm install --legacy-peer-deps', './backend');
run('npm run build:local', './backend');
