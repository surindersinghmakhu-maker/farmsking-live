const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');

const fixLine = (idx) => {
  if (lines[idx] && lines[idx].includes('</View>')) {
    lines[idx] = lines[idx].replace('</View>', '</Hoverable4DCard>');
  }
};

fixLine(360);
fixLine(375);
fixLine(390);
fixLine(405);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Fixed lines directly');
