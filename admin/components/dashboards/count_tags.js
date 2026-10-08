const fs = require('fs');
const content = fs.readFileSync('d:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx', 'utf8');

const opens = (content.match(/<Hoverable4DCard/g) || []).length;
const closes = (content.match(/<\/Hoverable4DCard>/g) || []).length;

console.log('opens:', opens);
console.log('closes:', closes);
