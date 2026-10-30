const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

// Add D:\nodejs to PATH if exists
const localNodeDir = 'D:\\nodejs';
if (fs.existsSync(localNodeDir) && !process.env.PATH.includes(localNodeDir)) {
  process.env.PATH = `${localNodeDir};${process.env.PATH}`;
}

const nodeExe = fs.existsSync(path.join(localNodeDir, 'node.exe'))
  ? path.join(localNodeDir, 'node.exe')
  : (process.platform === 'win32' ? 'node.exe' : 'node');

// Ultra-fast environment configuration: bypass telemetry, remote checks, and allocate balanced 2GB RAM
process.env.NODE_OPTIONS = '--max-old-space-size=2048';
process.env.EXPO_NO_TELEMETRY = '1';
process.env.EXPO_OFFLINE = '1';
delete process.env.CI;
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';
process.env.FAST_REFRESH = 'true';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.green}👑 FarmsKing Fast Multi-Server Launcher${colors.reset}`);
console.log(`${colors.cyan}⚡ Launching Backend (3000), Frontend (8081), and Admin (8082) in parallel at maximum speed...${colors.reset}\n`);

const frontendCli = path.join(rootDir, 'frontend', 'node_modules', 'expo', 'bin', 'cli');
const adminCli = path.join(rootDir, 'admin', 'node_modules', 'expo', 'bin', 'cli');

const services = [
  {
    name: 'BACKEND ',
    color: colors.green,
    cwd: path.join(rootDir, 'backend'),
    command: nodeExe,
    args: ['dist/main.js'],
    port: 3000,
    url: 'http://localhost:3000/api/v1',
  },
  {
    name: 'FRONTEND',
    color: colors.blue,
    cwd: rootDir,
    command: nodeExe,
    args: ['scripts/serve-frontend.js'],
    port: 8081,
    url: 'http://localhost:8081',
  },
  {
    name: 'ADMIN   ',
    color: colors.magenta,
    cwd: rootDir,
    command: nodeExe,
    args: ['scripts/serve-admin.js'],
    port: 8082,
    url: 'http://localhost:8082',
  },
];

const children = [];

function killExistingPorts() {
  try {
    const killPort = require('kill-port');
    return Promise.all([killPort(3000), killPort(8081), killPort(8082)]).catch(() => {});
  } catch (err) {
    return Promise.resolve();
  }
}

function startService(svc) {
  const child = spawn(svc.command, svc.args, {
    cwd: svc.cwd,
    env: { ...process.env, PORT: String(svc.port) },
    shell: false,
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      const trimmed = line.trimEnd();
      if (trimmed) {
        console.log(`${svc.color}[${svc.name}]${colors.reset} ${trimmed}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      const trimmed = line.trimEnd();
      if (trimmed) {
        console.error(`${colors.red}[${svc.name} ERR]${colors.reset} ${trimmed}`);
      }
    });
  });

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.yellow}[${svc.name}] process exited with code ${code}${colors.reset}`);
    }
  });

  children.push(child);
}

function cleanup() {
  console.log(`\n${colors.yellow}🛑 Stopping all FarmsKing servers...${colors.reset}`);
  children.forEach((child) => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start all services in parallel
killExistingPorts().then(() => {
  services.forEach(startService);

  console.log(`\n${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`  🚀 ${colors.bright}Backend API:${colors.reset}       http://localhost:3000/api/v1  (Docs: http://localhost:3000/api/docs)`);
  console.log(`  🌾 ${colors.bright}Frontend Web:${colors.reset}      http://localhost:8081`);
  console.log(`  👑 ${colors.bright}Admin Portal:${colors.reset}      http://localhost:8082`);
  console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}Tip: Press Ctrl + C at any time to stop all servers simultaneously.${colors.reset}\n`);
});
