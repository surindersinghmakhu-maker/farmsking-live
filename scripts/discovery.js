const fs = require('fs');
const path = require('path');

// 1. Roles
const enumsFile = fs.readFileSync('backend/prisma/schema/enums.prisma', 'utf8');
const roleMatch = enumsFile.match(/enum\s+Role\s*\{([^}]+)\}/);
const roles = roleMatch ? roleMatch[1].split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('//')) : [];
console.log('--- ROLES (' + roles.length + ') ---');
console.log(roles.join(', '));

// 2. Auth Files
const authFiles = fs.readdirSync('backend/src/modules/auth');
console.log('\n--- AUTH MODULE FILES ---');
console.log(authFiles.join(', '));

// 3. Controllers
function findControllers(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        list = list.concat(findControllers(full));
      }
    } else if (entry.name.endsWith('.controller.ts')) {
      const code = fs.readFileSync(full, 'utf8');
      const m = code.match(/@Controller\((?:['"`]([^'"`]*)['"`])?\)/);
      list.push({ file: full.replace(/\\/g, '/'), prefix: m ? (m[1] || '') : '' });
    }
  }
  return list;
}
const controllers = findControllers('backend/src');
console.log('\n--- BACKEND CONTROLLERS (' + controllers.length + ') ---');
controllers.forEach(c => console.log(`  - ${c.prefix.padEnd(35)} -> ${c.file}`));

// 4. Frontend Routes
function findRoutes(dir, baseDir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.expo') {
        list = list.concat(findRoutes(full, baseDir));
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      const rel = path.relative(baseDir, full).replace(/\\/g, '/');
      list.push(rel);
    }
  }
  return list;
}
const frontendRoutes = findRoutes('frontend/app', 'frontend/app');
console.log('\n--- FRONTEND APP ROUTES (' + frontendRoutes.length + ') ---');
frontendRoutes.forEach(r => console.log(`  - ${r}`));

// 5. Admin Structure
const adminEntries = fs.readdirSync('admin', { withFileTypes: true }).map(e => e.name);
console.log('\n--- ADMIN ROOT STRUCTURE ---');
console.log(adminEntries.join(', '));
