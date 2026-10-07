const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Exact string references in routing
    const newContent = content
        .replace(/\/\(admin\)/g, '/admin')
        .replace(/currentGroup === '\(admin\)'/g, "currentGroup === 'admin'")
        .replace(/name="\(admin\)"/g, 'name="admin"')
        .replace(/href="\/\(admin\)/g, 'href="/admin');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Updated: ' + filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}

const adminDir = path.join(__dirname, 'frontend/app/(admin)');
const newAdminDir = path.join(__dirname, 'frontend/app/admin');

if (fs.existsSync(adminDir)) {
    fs.renameSync(adminDir, newAdminDir);
    console.log('Renamed directory (admin) to admin');
}

walkDir(path.join(__dirname, 'frontend/app'));
if (fs.existsSync(path.join(__dirname, 'frontend/src'))) {
    walkDir(path.join(__dirname, 'frontend/src'));
}

console.log('Done replacing references.');
