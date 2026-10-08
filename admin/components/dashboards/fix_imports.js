const fs = require('fs');
const path = require('path');

const tabsDir = 'd:/FarmsKing/admin/app/admin/(tabs)';
const files = fs.readdirSync(tabsDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(tabsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix Pressable import
  if (content.includes('Hoverable4DCard') && !content.includes('import { Pressable }') && !content.includes('Pressable,')) {
    // try to find where react-native is imported
    const rnImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];/);
    if (rnImportMatch) {
      if (!rnImportMatch[1].includes('Pressable')) {
        content = content.replace(rnImportMatch[0], "import { " + rnImportMatch[1].trim() + ", Pressable } from 'react-native';");
      }
    } else {
      // Just add it at the top
      content = "import { Pressable } from 'react-native';\n" + content;
    }
  }

  // Fix "Hoverable4DCard = ({ children, style, onPress }: any)" to properly type Pressable state callback
  // Some files have it without typing which TS complains about
  content = content.replace(/style=\{\(\{ hovered, pressed \}\) =>/g, "style={({ hovered, pressed }: any) =>");

  // Fix duplicate properties in userCard (from my previous script)
  content = content.replace(/userCard:\s*\{\s*borderColor:\s*'rgba\(0,255,135,0\.15\)',\s*borderWidth:\s*1,\s*flexDirection:/g, 
    "userCard: {\n    borderColor: 'rgba(0,255,135,0.15)',\n    borderWidth: 1,\n    flexDirection:");
  
  // Remove duplicate border declarations safely for super-users
  if (file === 'super-users.tsx') {
    let replaced = content.replace(/userCard:\s*\{\s*borderColor:\s*'rgba\(0,255,135,0\.15\)',\s*borderWidth:\s*1,\s*flexDirection:\s*'row',\s*alignItems:\s*'center',\s*gap:\s*10,\s*backgroundColor:\s*'rgba\(0,255,135,0\.03\)',\s*borderRadius:\s*RADIUS\.lg,\s*paddingVertical:\s*SPACING\.sm,\s*paddingHorizontal:\s*SPACING\.md,\s*borderWidth:\s*1,\s*borderColor:\s*'rgba\(0,255,135,0\.2\)',/g,
    "userCard: {\n    borderColor: 'rgba(0,255,135,0.3)',\n    flexDirection: 'row',\n    alignItems: 'center',\n    gap: 10,\n    backgroundColor: 'rgba(0,255,135,0.03)',\n    borderRadius: RADIUS.lg,\n    paddingVertical: SPACING.sm,\n    paddingHorizontal: SPACING.md,\n    borderWidth: 1,");
    
    // Fallback if previous replace didn't work
    replaced = replaced.replace(/borderWidth:\s*1,(\s*[\s\S]*?)borderWidth:\s*1,/g, 'borderWidth: 1,$1');
    replaced = replaced.replace(/borderColor:\s*'rgba\(0,255,135,0\.15\)',(\s*[\s\S]*?)borderColor:\s*'rgba\(0,255,135,0\.2\)',/g, 'borderColor: \'rgba(0,255,135,0.3)\',$1');

    content = replaced;
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed imports and TS errors in tabs');
