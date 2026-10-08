const fs = require('fs');
const path = require('path');

const tabsDir = 'd:/FarmsKing/admin/app/admin/(tabs)';
const files = fs.readdirSync(tabsDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(tabsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix trailing commas before Pressable
  if (content.includes(',, Pressable')) {
    content = content.replace(/,,\s*Pressable/g, ', Pressable');
  }
  if (content.includes(', , Pressable')) {
    content = content.replace(/,\s*,\s*Pressable/g, ', Pressable');
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed trailing commas');
