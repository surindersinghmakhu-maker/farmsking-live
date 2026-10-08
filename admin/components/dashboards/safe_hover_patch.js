const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Pressable to imports
if (!content.includes('import { Pressable }')) {
    content = content.replace("import { View, Text", "import { View, Text, Pressable");
}

// 2. Inject Hoverable4DCard definition before the component
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

if (!content.includes('Hoverable4DCard')) {
  content = content.replace('export const SuperAdminDashboardView: React.FC = () => {', hoverableComp + '\\nexport const SuperAdminDashboardView: React.FC = () => {');
}

// 3. Replace the 4 matrix4dCard exact blocks!
// I will use regex to find `<View style={styles.matrix4dCard}>` and match until the next `<View style={styles.matrix4dCard}>` or `</View>\r\n        </View>`
// Actually, I can just use a simple state machine to balance tags!
function replaceTags(str) {
  let result = '';
  let i = 0;
  
  // We want to find `<View style={styles.matrix4dCard}>`
  const target = '<View style={styles.matrix4dCard}>';
  
  while (i < str.length) {
    const idx = str.indexOf(target, i);
    if (idx === -1) {
      result += str.substring(i);
      break;
    }
    
    result += str.substring(i, idx);
    result += '<Hoverable4DCard style={styles.matrix4dCard}>';
    
    // Now balance the tags to find the closing </View>
    let j = idx + target.length;
    let depth = 1;
    let lastClosingTagIdx = -1;
    
    while (j < str.length && depth > 0) {
      const nextOpen = str.indexOf('<View', j);
      const nextClose = str.indexOf('</View>', j);
      
      if (nextClose === -1) break;
      
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        j = nextOpen + 5;
      } else {
        depth--;
        lastClosingTagIdx = nextClose;
        j = nextClose + 7;
      }
    }
    
    // The content inside the card
    const innerContent = str.substring(idx + target.length, lastClosingTagIdx);
    result += innerContent;
    result += '</Hoverable4DCard>';
    
    i = lastClosingTagIdx + 7;
  }
  
  return result;
}

content = replaceTags(content);

// 4. Replace ecoCards
const ecoCardRegex = /<TouchableOpacity (style=\{\[styles\.ecoCard[\s\S]*?\} onPress=\{.*?})>([\s\S]*?)<\/TouchableOpacity>/g;
content = content.replace(ecoCardRegex, (match, props, inner) => {
  return "<Hoverable4DCard " + props + ">" + inner + "</Hoverable4DCard>";
});
content = content.replace(/<Hoverable4DCard(.*?)activeOpacity=\{0\.8\}(.*?)>/g, '<Hoverable4DCard$1$2>');

fs.writeFileSync(path, content, 'utf8');
console.log('Success');
