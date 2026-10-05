const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'app');
const oldTabsPath = path.join(basePath, '(tabs)');

const filesToCopy = ['_layout.tsx', 'index.tsx'];

['admin', 'partner', 'user'].forEach(role => {
  filesToCopy.forEach(file => {
    const src = path.join(oldTabsPath, file);
    // Escape string manually to avoid powershell interpolation issues if we did it inline
    const dest = path.join(basePath, '(' + role + ')', '(tabs)', file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
});

// Remove old tabs directory
if (fs.existsSync(oldTabsPath)) {
  fs.rmSync(oldTabsPath, { recursive: true, force: true });
}
console.log('Duplicated _layout.tsx and index.tsx. Removed old (tabs).');
