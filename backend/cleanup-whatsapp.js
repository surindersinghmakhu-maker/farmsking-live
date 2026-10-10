
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Remove imports
  if (content.match(/import.*whatsapp.*?;/g)) {
    content = content.replace(/import.*whatsapp.*?\n/g, '');
    changed = true;
  }

  // Remove Module from imports array
  if (content.match(/WhatsappBotModule,?/g)) {
    content = content.replace(/WhatsappBotModule,?/g, '');
    changed = true;
  }
  
  if (content.match(/WhatsAppGroupSyncService,?/g)) {
    content = content.replace(/WhatsAppGroupSyncService,?/g, '');
    changed = true;
  }

  if (content.match(/WhatsappBotService,?/g)) {
    content = content.replace(/WhatsappBotService,?/g, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Cleaned', file);
  }
});

