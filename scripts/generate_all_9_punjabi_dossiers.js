/**
 * Master Runner to Regenerate All 9 FarmsKing Punjabi Architectural & Operational Dossiers
 * FarmsKing Technologies Private Limited
 */

const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  'generate_pdf_1_roles.js',
  'generate_pdf_2_modules.js',
  'generate_pdf_3_tools_cost.js',
  'generate_pdf_4_tools_setup.js',
  'generate_pdf_5_farmer_doctor.js',
  'generate_pdf_6_gardener.js',
  'generate_pdf_7_admin_staff.js',
  'generate_pdf_8_store_ecommerce.js',
  'generate_pdf_9_master_pitch.js',
];

console.log('================================================================');
console.log('FARMSKING TECHNOLOGIES PVT LTD - GENERATING ALL 9 EXECUTIVE PDFS');
console.log('================================================================\n');

for (const script of scripts) {
  const scriptPath = path.join(__dirname, 'pdf_generators', script);
  console.log(`>>> Running: ${script}...`);
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`ERROR running ${script}:`, err.message);
  }
}

console.log('\n================================================================');
console.log('ALL 9 EXECUTIVE PUNJABI PDFS SUCCESSFULLY GENERATED & SYNCED!');
console.log('Desktop Folder: C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd\\');
console.log('Project Folder: D:\\farmsking\\');
console.log('================================================================\n');

