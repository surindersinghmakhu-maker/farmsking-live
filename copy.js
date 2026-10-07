const fs = require('fs');
const path = require('path');

function copySync(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);
        for (const file of files) {
            if (['node_modules', '.expo', 'dist', '.git'].includes(file)) continue;
            copySync(path.join(src, file), path.join(dest, file));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

const src = path.join(__dirname, 'frontend');
const dest = path.join(__dirname, 'admin');

console.log('Copying frontend to admin...');
copySync(src, dest);

const pkgPath = path.join(dest, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = 'farmsking-admin';
pkg.scripts.start = "expo start --port 8082";
pkg.scripts.web = "expo start --web --port 8082";
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log('Copy complete.');
