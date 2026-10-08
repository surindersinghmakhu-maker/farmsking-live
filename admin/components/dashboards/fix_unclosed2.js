const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

// I will just parse lines, and fix lines 361, 376, 391, 406 exactly since I know the exact line numbers from `view_file`.
const lines = content.split('\\n');

// Since view_file showed lines 361, 376, 391, 406 (0-indexed it would be -1, but let's check exact content)
const fixLine = (idx) => {
  if (lines[idx].includes('</View>')) {
    lines[idx] = lines[idx].replace('</View>', '</Hoverable4DCard>');
  }
};

fixLine(360);
fixLine(375);
fixLine(390);
fixLine(405);

fs.writeFileSync(path, lines.join('\\n'), 'utf8');
console.log('Fixed lines directly');
