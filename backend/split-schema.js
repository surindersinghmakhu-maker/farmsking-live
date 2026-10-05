const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const schemaDir = path.join(__dirname, 'prisma', 'schema');

if (!fs.existsSync(schemaDir)) {
  fs.mkdirSync(schemaDir, { recursive: true });
}

const content = fs.readFileSync(schemaPath, 'utf8');
const lines = content.split('\n');

let currentFile = 'base.prisma';
let currentContent = [];
let hasGenerator = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line.includes('generator client {')) {
    hasGenerator = true;
  }
  
  if (hasGenerator && line.includes('}')) {
    currentContent.push(line);
    // Insert preview feature before closing brace if not present
    if (!currentContent.join('\n').includes('prismaSchemaFolder')) {
      currentContent.splice(currentContent.length - 1, 0, '  previewFeatures = ["prismaSchemaFolder"]');
    }
    hasGenerator = false;
    continue;
  }

  // Detect section headers
  if (line.startsWith('// ───')) {
    // Save current content
    fs.writeFileSync(path.join(schemaDir, currentFile), currentContent.join('\n'));
    
    // Determine new file name
    const match = line.match(/Phase \d+:\s*(.*?)─/);
    if (match) {
      currentFile = match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.prisma';
    } else if (line.includes('Enums')) {
      currentFile = 'enums.prisma';
    } else {
      currentFile = `section_${Math.floor(Math.random()*1000)}.prisma`;
    }
    
    currentContent = [line];
    continue;
  }
  
  currentContent.push(line);
}

// Save the last chunk
fs.writeFileSync(path.join(schemaDir, currentFile), currentContent.join('\n'));

// Rename original so it doesn't conflict
fs.renameSync(schemaPath, schemaPath + '.bak');

console.log('Schema split successfully!');
