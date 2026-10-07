const fs = require('fs');
const path = 'app/shop.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace background colors
code = code.replace(/backgroundColor:\s*['"]#f8fafc['"]/g, "backgroundColor: '#0f172a'");
code = code.replace(/backgroundColor:\s*['"]#ffffff['"]/g, "backgroundColor: '#1e293b'");
code = code.replace(/backgroundColor:\s*['"]#fff['"]/g, "backgroundColor: '#1e293b'");

// Replace text colors
code = code.replace(/color:\s*['"]#0f172a['"]/g, "color: '#ffffff'");
code = code.replace(/color:\s*['"]#1e293b['"]/g, "color: '#f8fafc'");
code = code.replace(/color:\s*['"]#334155['"]/g, "color: '#e2e8f0'");
code = code.replace(/color:\s*['"]#475569['"]/g, "color: '#cbd5e1'");

// Replace border colors
code = code.replace(/borderColor:\s*['"]#e2e8f0['"]/g, "borderColor: '#334155'");
code = code.replace(/borderColor:\s*['"]#f1f5f9['"]/g, "borderColor: '#1e293b'");
code = code.replace(/borderColor:\s*['"]#f8fafc['"]/g, "borderColor: '#0f172a'");

// Replace light backgrounds used for hover/dividers
code = code.replace(/backgroundColor:\s*['"]#f1f5f9['"]/g, "backgroundColor: '#334155'");
code = code.replace(/backgroundColor:\s*['"]#e2e8f0['"]/g, "backgroundColor: '#475569'");

fs.writeFileSync(path, code);
console.log('Converted to dark theme');
