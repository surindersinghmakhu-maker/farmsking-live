
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Replace lines
  const lines = content.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('whatsapp.module')) { changed = true; continue; }
    if (line.includes('whatsapp.service')) { changed = true; continue; }
    if (line.includes('whatsapp-group-sync.service')) { changed = true; continue; }
    
    if (line.includes('this.whatsappGroupSyncService.autoAddNewUser')) { changed = true; continue; }
    if (line.includes('this.whatsappGroupSyncService.autoRemoveUser')) { changed = true; continue; }
    
    if (line.includes('whatsappGroupSyncService: WhatsAppGroupSyncService')) { changed = true; continue; }
    if (line.includes('whatsAppGroupSyncService: WhatsAppGroupSyncService')) { changed = true; continue; }
    if (line.includes('whatsappBotService: WhatsappBotService')) { changed = true; continue; }
    if (line.includes('whatsappBotService?: WhatsappBotService')) { changed = true; continue; }
    
    if (line.includes('this.whatsappBotService.sendDirectTextMessage')) { changed = true; continue; }
    if (line.includes('this.whatsappBotService.getQrCodeStatus')) { changed = true; continue; }
    if (line.includes('if (user.mobile && this.whatsappBotService) {')) { 
      // Need to skip block in wallet.service.ts
      i += 11;
      changed = true;
      continue; 
    }
    
    if (line.includes('this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus')) { changed = true; continue; }
    if (line.includes('WhatsappBotModule')) {
       // Replace WhatsappBotModule in imports array
       newLines.push(line.replace(/,\s*WhatsappBotModule/g, '').replace(/WhatsappBotModule,?\s*/g, ''));
       changed = true;
       continue;
    }
    if (line.includes('this.logger.log([DEVELOPMENT ONLY]')) {
        newLines.push(line.replace('this.logger.log', 'console.log'));
        changed = true;
        continue;
    }

    newLines.push(line);
  }

  if (changed) {
    fs.writeFileSync(file, newLines.join('\n'));
    console.log('Cleaned', file);
  }
});

