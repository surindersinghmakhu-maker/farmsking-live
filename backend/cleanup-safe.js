
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Replace import lines entirely
  if (content.match(/import.*whatsapp.*?\n/)) {
    content = content.replace(/import.*whatsapp.*?\n/g, '');
    changed = true;
  }

  // Replace WhatsappBotModule in arrays
  if (content.match(/WhatsappBotModule,?\s*/)) {
    content = content.replace(/,\s*WhatsappBotModule/g, '');
    content = content.replace(/WhatsappBotModule,?\s*/g, '');
    changed = true;
  }
  
  if (content.match(/WhatsAppGroupSyncService,?\s*/)) {
    content = content.replace(/,\s*WhatsAppGroupSyncService/g, '');
    content = content.replace(/WhatsAppGroupSyncService,?\s*/g, '');
    changed = true;
  }

  if (content.match(/WhatsappBotService,?\s*/)) {
    content = content.replace(/,\s*WhatsappBotService/g, '');
    content = content.replace(/WhatsappBotService,?\s*/g, '');
    changed = true;
  }

  // Safe removal of method calls without leaving trailing commas in arguments
  const lines = content.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains property definition
    if (line.match(/private\s+readonly\s+whatsappBotService/)) { changed = true; continue; }
    if (line.match(/private\s+readonly\s+whatsAppGroupSyncService/)) { changed = true; continue; }
    if (line.match(/private\s+readonly\s+whatsappGroupSyncService/)) { changed = true; continue; }
    if (line.match(/private\s+readonly\s+groupSyncService/)) { changed = true; continue; }
    if (line.match(/private\s+readonly\s+whatsappService/)) { changed = true; continue; }
    
    if (line.match(/this\.whatsappGroupSyncService\.autoAddNewUser/)) { changed = true; continue; }
    if (line.match(/this\.whatsappGroupSyncService\.autoRemoveUser/)) { changed = true; continue; }
    if (line.match(/this\.whatsAppGroupSyncService\.syncSingleFarmerGroupStatus/)) { changed = true; continue; }
    
    if (line.match(/this\.whatsappBotService\.sendDirectTextMessage/)) { changed = true; continue; }
    
    // In auth.service.ts there's a multiline block for autoAddNewUser:
    if (line.match(/user\.id,/)) {
       if (newLines.length > 0 && newLines[newLines.length - 1].includes('Auto-add new user to WhatsApp group')) {
           // Skip this line and the next two!
           i += 3;
           changed = true;
           continue;
       }
    }

    if (line.includes('this.logger.log([DEVELOPMENT ONLY]')) {
        newLines.push(line.replace('this.logger.log', 'console.log'));
        changed = true;
        continue;
    }
    
    if (line.includes('if (user.mobile && this.whatsappBotService) {')) { 
      // Skip block in wallet.service.ts
      i += 11;
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

