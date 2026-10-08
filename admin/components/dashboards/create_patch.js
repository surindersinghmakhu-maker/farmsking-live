const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Ensure Pressable is imported
if (!content.includes('Pressable')) {
    content = content.replace("import { View,", "import { View, Pressable,");
    if (!content.includes('Pressable')) {
       // if it wasn't replaced, just inject it
       content = content.replace("import {", "import { Pressable,");
    }
}

// 2. Replace matrix4dCard Views with Pressable
content = content.replace(/<View style=\{styles\.matrix4dCard\}>/g, 
  `<Pressable style={({ hovered }) => [styles.matrix4dCard, hovered && styles.matrix4dCardHovered]}>`);
content = content.replace(/<\/View>(\s*)<View style=\{styles\.matrix4dCard\}>/g, 
  `</Pressable>$1<Pressable style={({ hovered }) => [styles.matrix4dCard, hovered && styles.matrix4dCardHovered]}>`);

// Need to fix the closing tags of matrix4dCard. 
// Since they were <View>, they end with </View>. We have to selectively replace the closing tags of matrix4dCard.
// It's safer to just write a simple regex for the block or use a small React component wrapper.

// Wait, replacing closing tags for a nested View is very hard with regex.
// Instead of Pressable, I can just define a custom component at the top of the file!
const wrapperComponent = `
const Hoverable4DCard = ({ children, style }) => {
  return (
    <Pressable style={({ hovered, pressed }) => [
      style,
      hovered && {
        borderColor: 'rgba(0,255,135,0.55)',
        boxShadow: '0 28px 65px -15px rgba(0, 255, 135, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
        transform: [{ scale: 1.02 }]
      },
      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
    ]}>
      {children}
    </Pressable>
  );
};
`;

if (!content.includes('Hoverable4DCard')) {
  // inject after imports
  content = content.replace('export default function SuperAdminDashboardView', wrapperComponent + '\nexport default function SuperAdminDashboardView');
}

// 3. Replace `<View style={styles.matrix4dCard}>` with `<Hoverable4DCard style={styles.matrix4dCard}>`
content = content.replace(/<View style=\{styles\.matrix4dCard\}>/g, '<Hoverable4DCard style={styles.matrix4dCard}>');

// But how to replace the closing tags? 
// The matrix4dCard blocks are usually like:
/*
            <Hoverable4DCard style={styles.matrix4dCard}>
              <View style={styles.matrix4dCardHeader}>
                <Text style={styles.matrix4dCardTitle}>Pending Actions</Text>
                ...
              </View>
              ...
            </View> -> needs to be </Hoverable4DCard>
*/
// It is easier to replace them manually by reading the file and doing exact string replacements.
fs.writeFileSync('d:/FarmsKing/admin/components/dashboards/patch_hover.js', content, 'utf8');
