
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  const patternsToRemove = [
    /^\s*private\s+readonly\s+whatsappBotService\s*:\s*,?\s*$/gm,
    /^\s*private\s+readonly\s+whatsAppGroupSyncService\s*:\s*,?\s*$/gm,
    /^\s*private\s+readonly\s+whatsappGroupSyncService\s*:\s*,?\s*$/gm,
    /^\s*@Optional\(\)\s*private\s+readonly\s+whatsappBotService\??\s*:\s*,?\s*$/gm,
    /^\s*this\.whatsappGroupSyncService\..*$/gm,
    /^\s*this\.whatsAppGroupSyncService\..*$/gm,
    /^\s*this\.whatsappBotService\..*$/gm,
    /^\s*if\s*\([^)]*this\.whatsappBotService[^)]*\)\s*{[\s\S]*?}/gm,
    /^\s*this\.logger\.log.*$/gm
  ];

  for (const p of patternsToRemove) {
    if (content.match(p)) {
      content = content.replace(p, '');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Cleaned services in', file);
  }
});

