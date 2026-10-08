const fs = require('fs');
const path = require('path');

const tabsDir = 'd:/FarmsKing/admin/app/admin/(tabs)';
const files = fs.readdirSync(tabsDir).filter(f => f.endsWith('.tsx') && !f.startsWith('_'));

const hoverableComp = `
const Hoverable4DCard = ({ children, style, onPress }: any) => {
  return (
    <Pressable onPress={onPress} style={({ hovered, pressed }) => [
      style,
      hovered && {
        borderColor: 'rgba(0,255,135,0.55)',
        shadowColor: '#00ff87',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        transform: [{ scale: 1.02 }]
      },
      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
    ]}>
      {children}
    </Pressable>
  );
};
`;

files.forEach(file => {
  const filePath = path.join(tabsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already 4D
  if (content.includes('Hoverable4DCard')) {
      // Just update some colors if not already updated
  } else {
      // Add Pressable
      if (!content.includes('Pressable')) {
          content = content.replace("import { View, Text", "import { View, Text, Pressable");
          if (!content.includes('Pressable')) {
              content = content.replace("import { View", "import { View, Pressable");
          }
      }

      // Inject Hoverable4DCard before the default export
      const defaultExportMatch = content.match(/export default function .*?\(/);
      if (defaultExportMatch) {
          content = content.replace(defaultExportMatch[0], hoverableComp + '\n' + defaultExportMatch[0]);
      } else {
          const exportConstMatch = content.match(/export const .*? = \(/);
          if (exportConstMatch) {
              content = content.replace(exportConstMatch[0], hoverableComp + '\n' + exportConstMatch[0]);
          }
      }
  }

  // Common replacements for the 4D aesthetic
  // Backgrounds
  content = content.replace(/backgroundColor:\s*'#f8fafc'/g, "backgroundColor: '#020d06'");
  content = content.replace(/backgroundColor:\s*'#f1f5f9'/g, "backgroundColor: '#051b11'");
  // text
  content = content.replace(/color:\s*'#0f172a'/g, "color: '#ffffff'");
  content = content.replace(/color:\s*'#334155'/g, "color: '#e2e8f0'");
  content = content.replace(/color:\s*'#1e293b'/g, "color: '#ffffff'");
  // Borders
  content = content.replace(/borderColor:\s*'#f1f5f9'/g, "borderColor: 'rgba(0,255,135,0.2)'");
  content = content.replace(/borderColor:\s*'#e2e8f0'/g, "borderColor: 'rgba(0,255,135,0.3)'");
  
  // Cards to 4D Cards
  content = content.replace(/backgroundColor:\s*'#ffffff'/g, "backgroundColor: 'rgba(0,255,135,0.03)'");
  // Some specific styles in super-users
  content = content.replace(/userCard:\s*\{/g, "userCard: {\n    borderColor: 'rgba(0,255,135,0.15)',\n    borderWidth: 1,");
  
  // Convert standard TouchableOpacity cards to Hoverable4DCard if they look like cards
  // We'll leave this to manual replacement for structural things, but let's do the styling first.

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('4D Transformer completed on ' + files.length + ' files');
