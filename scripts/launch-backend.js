const { spawn } = require('child_process');
const path = require('path');

const cwd = path.resolve(__dirname, '../backend');
const child = spawn(process.execPath, ['dist/main.js'], {
  cwd,
  env: {
    ...process.env,
    PORT: '3000',
    NODE_OPTIONS: '--max-old-space-size=2048',
  },
  stdio: 'inherit',
});

child.on('exit', (code) => {
  console.log('Backend exited with code', code);
  process.exit(code || 0);
});

