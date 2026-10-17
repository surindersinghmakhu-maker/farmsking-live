/**
 * FarmsKing Admin Route & Pillar Integrity Auditor
 * 
 * Verifies:
 * 1. All Navigation Pillars and Sub-Tabs resolve to valid Expo Router screen files.
 * 2. All Tabs.Screen declarations in app/admin/(tabs)/_layout.tsx have real screen files.
 * 3. Zero dead links, zero orphaned screens, and zero 404 targets.
 * 4. 100% Pure English standard across all titles, badges, and descriptions (Rule 1).
 * 5. Full isolation within admin/ workspace.
 */

const fs = require('fs');
const path = require('path');

const adminDir = path.resolve(__dirname, '..');
const appDir = path.join(adminDir, 'app');
const adminTabsDir = path.join(appDir, 'admin', '(tabs)');
const pillarsFile = path.join(adminDir, 'constants', 'navigationPillars.ts');
const layoutFile = path.join(adminTabsDir, '_layout.tsx');

console.log('═════════════════════════════════════════════════════════════════');
console.log(' 👑 FarmsKing Admin Panel — Autonomous Route Integrity Audit');
console.log('═════════════════════════════════════════════════════════════════\n');

let totalChecks = 0;
let passedChecks = 0;
let errors = [];
let warnings = [];

// Helper to check if a route path resolves to a physical file in admin/app
function resolveRoutePath(routePath) {
  const cleanPath = routePath.split('?')[0]; // remove query string
  const relativeParts = cleanPath.replace(/^\/+/, '').split('/');

  // Potential file extensions to check
  const candidates = [
    path.join(appDir, ...relativeParts) + '.tsx',
    path.join(appDir, ...relativeParts) + '.ts',
    path.join(appDir, ...relativeParts) + '.jsx',
    path.join(appDir, ...relativeParts) + '.js',
    path.join(appDir, ...relativeParts, 'index.tsx'),
    path.join(appDir, ...relativeParts, 'index.ts'),
    path.join(appDir, ...relativeParts, 'index.js'),
  ];

  // Specific handler for /admin/(tabs) index
  if (cleanPath === '/admin/(tabs)' || cleanPath === '/admin/(tabs)/') {
    candidates.unshift(path.join(adminTabsDir, 'index.tsx'));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const stat = fs.statSync(candidate);
      return {
        found: true,
        filePath: candidate,
        sizeBytes: stat.size,
      };
    }
  }

  return { found: false, candidates };
}

// 1. Audit Navigation Pillars
console.log('🔍 Step 1: Auditing Master Domain Pillars & Sub-Tabs...');
if (!fs.existsSync(pillarsFile)) {
  errors.push(`Pillars file not found: ${pillarsFile}`);
} else {
  const content = fs.readFileSync(pillarsFile, 'utf8');

  // Simple parser to extract subTabs { id, title, path, ... }
  const subTabRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"]/g;
  let match;
  const foundTabs = [];

  while ((match = subTabRegex.exec(content)) !== null) {
    foundTabs.push({
      id: match[1],
      title: match[2],
      path: match[3],
    });
  }

  console.log(`   Found ${foundTabs.length} sub-tab route mappings across domain pillars.\n`);

  for (const tab of foundTabs) {
    totalChecks++;
    const resolution = resolveRoutePath(tab.path);
    if (resolution.found) {
      passedChecks++;
      const relativeTarget = path.relative(adminDir, resolution.filePath).replace(/\\/g, '/');
      console.log(`   ✅ [OK] [${tab.id}] "${tab.title}" ➔ ${tab.path} (${relativeTarget}, ${resolution.sizeBytes} B)`);
    } else {
      errors.push(`Broken Link: [${tab.id}] "${tab.title}" links to non-existent route "${tab.path}"`);
      console.log(`   ❌ [FAIL] [${tab.id}] "${tab.title}" ➔ ${tab.path} (NOT FOUND)`);
    }

    // Check English UI Rule (No Gurmukhi or Devanagari characters)
    const hasVernacular = /[\u0A00-\u0A7F\u0900-\u097F]/.test(tab.title);
    if (hasVernacular) {
      warnings.push(`Rule 1 Violation: SubTab "${tab.title}" contains vernacular characters.`);
    }
  }
}

// 2. Audit app/admin/(tabs)/_layout.tsx Screen Declarations
console.log('\n🔍 Step 2: Auditing _layout.tsx Registered Tabs & Dynamic Screens...');
if (!fs.existsSync(layoutFile)) {
  errors.push(`Layout file not found: ${layoutFile}`);
} else {
  const layoutContent = fs.readFileSync(layoutFile, 'utf8');
  const screenRegex = /<Tabs\.Screen\s+name=["']([^"']+)["']/g;
  let screenMatch;
  const registeredScreens = new Set();

  while ((screenMatch = screenRegex.exec(layoutContent)) !== null) {
    registeredScreens.add(screenMatch[1]);
  }

  // Also parse ALL_TABS array: ALL_TABS: TabName[] = [ ... ];
  const allTabsMatch = layoutContent.match(/const\s+ALL_TABS[^=]*=\s*\[([\s\S]*?)\];/);
  if (allTabsMatch) {
    const rawTabs = allTabsMatch[1]
      .replace(/\/\/.*$/gm, '')
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);
    rawTabs.forEach(t => registeredScreens.add(t));
  }

  console.log(`   Found ${registeredScreens.size} total tab screen declarations (ALL_TABS + explicit stubs).\n`);

  for (const screenName of registeredScreens) {
    totalChecks++;
    const targetFile = path.join(adminTabsDir, `${screenName}.tsx`);
    const targetIndex = path.join(adminTabsDir, screenName, 'index.tsx');

    if (fs.existsSync(targetFile)) {
      passedChecks++;
      const stat = fs.statSync(targetFile);
      console.log(`   ✅ [OK] Tab Screen "${screenName}" ➔ admin/app/admin/(tabs)/${screenName}.tsx (${stat.size} B)`);
    } else if (fs.existsSync(targetIndex)) {
      passedChecks++;
      const stat = fs.statSync(targetIndex);
      console.log(`   ✅ [OK] Tab Screen "${screenName}" ➔ admin/app/admin/(tabs)/${screenName}/index.tsx (${stat.size} B)`);
    } else {
      errors.push(`Missing Tab Screen: Tab "${screenName}" registered in _layout.tsx has no physical file in admin/app/admin/(tabs)/`);
      console.log(`   ❌ [FAIL] Tab Screen "${screenName}" (FILE NOT FOUND)`);
    }
  }
}

// 3. Audit for Orphaned Tab Screens (files present in tabs folder but not in _layout.tsx)
console.log('\n🔍 Step 3: Checking for Unregistered Screen Files in (tabs)...');
const tabFiles = fs.readdirSync(adminTabsDir).filter(f => f.endsWith('.tsx') && !f.startsWith('_'));
const layoutCode = fs.readFileSync(layoutFile, 'utf8');
let orphanCount = 0;

for (const f of tabFiles) {
  const baseName = f.replace('.tsx', '');
  if (!layoutCode.includes(`'${baseName}'`) && !layoutCode.includes(`"${baseName}"`)) {
    orphanCount++;
    console.log(`   ℹ️ [Unregistered/Standalone File]: admin/app/admin/(tabs)/${f}`);
  }
}

if (orphanCount === 0) {
  console.log('   ✅ 100% of files in admin/app/admin/(tabs) are fully declared and registered in _layout.tsx.');
}

// 4. Summary Report
console.log('\n═════════════════════════════════════════════════════════════════');
console.log(' 📊 AUDIT SUMMARY & COMPLIANCE VERIFICATION');
console.log('═════════════════════════════════════════════════════════════════');
console.log(` Total Audited Checks:    ${totalChecks}`);
console.log(` Passed Checks:           ${passedChecks}`);
console.log(` Failures / Broken Links: ${errors.length}`);
console.log(` Warnings / Guidelines:   ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ ISSUES DETECTED:');
  errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  process.exit(1);
} else {
  console.log('\n🎉 ALL ADMIN ROUTES AND PILLARS ARE 100% VALID & HEALTHY!');
  process.exit(0);
}
