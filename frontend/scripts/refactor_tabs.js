const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'app');
const oldTabsPath = path.join(basePath, '(tabs)');

const groups = {
  admin: [
    'admin-orders.tsx', 'admin-products.tsx', 'admin_more.tsx', 'admin_shop.tsx',
    'super-accounts.tsx', 'super-audit-log.tsx', 'super-coupons.tsx', 'super-crop-edit.tsx',
    'super-orders.tsx', 'super-settings.tsx', 'super-users.tsx', 'operator-orders.tsx'
  ],
  partner: [
    'farmers.tsx', 'referrals.tsx', 'trainer-dashboard.tsx', 'schedule.tsx', 'market.tsx'
  ],
  user: [
    'cart.tsx', 'categories.tsx', 'orders.tsx', 'records.tsx', 'shop.tsx'
  ]
};

const commonFiles = ['chat.tsx', 'wallet.tsx', 'more.tsx', 'crop-disease-scanner.tsx', 'satellite-map.tsx', 'memberships.tsx', 'coupons.tsx'];

// 1. Create Directories
['admin', 'partner', 'user'].forEach(role => {
  const rolePath = path.join(basePath, `(${role})`);
  const tabsPath = path.join(rolePath, '(tabs)');
  if (!fs.existsSync(rolePath)) fs.mkdirSync(rolePath);
  if (!fs.existsSync(tabsPath)) fs.mkdirSync(tabsPath);
});

// 2. Move specific files
Object.entries(groups).forEach(([role, files]) => {
  files.forEach(file => {
    const src = path.join(oldTabsPath, file);
    const dest = path.join(basePath, `(${role})`, '(tabs)', file);
    if (fs.existsSync(src)) {
      // For directories like 'farm'
      if (fs.statSync(src).isDirectory()) {
         fs.cpSync(src, dest, { recursive: true });
         fs.rmSync(src, { recursive: true });
      } else {
         fs.renameSync(src, dest);
      }
      console.log(`Moved ${file} to ${role}`);
    }
  });
});

// Also move 'farm' directory to user
const farmSrc = path.join(oldTabsPath, 'farm');
const farmDest = path.join(basePath, '(user)', '(tabs)', 'farm');
if (fs.existsSync(farmSrc)) {
  fs.cpSync(farmSrc, farmDest, { recursive: true });
  fs.rmSync(farmSrc, { recursive: true });
}

// 3. Duplicate common files to all 3 groups
commonFiles.forEach(file => {
  const src = path.join(oldTabsPath, file);
  if (fs.existsSync(src)) {
    ['admin', 'partner', 'user'].forEach(role => {
      const dest = path.join(basePath, `(${role})`, '(tabs)', file);
      fs.copyFileSync(src, dest);
    });
    fs.unlinkSync(src);
    console.log(`Duplicated ${file} to all groups`);
  }
});

console.log("Refactor phase 1 complete. Now we need to handle index.tsx and _layout.tsx.");
