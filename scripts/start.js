const { execSync } = require('child_process');

console.log('\n> Starting backend...');
try {
  execSync('node dist/main.js', { stdio: 'inherit', cwd: './backend' });
} catch (err) {
  process.exit(err.status || 1);
}
