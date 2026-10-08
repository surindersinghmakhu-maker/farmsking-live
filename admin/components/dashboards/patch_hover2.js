const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { Pressable }')) {
    content = content.replace("import {", "import { Pressable,");
}

const wrapperComponent = `
const Hoverable4DCard = ({ children, style, onPress }) => {
  return (
    <Pressable onPress={onPress} style={({ hovered, pressed }) => [
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
  content = content.replace(/const SuperAdminDashboardView = \(\) => \{/, wrapperComponent + '\nconst SuperAdminDashboardView = () => {');
}

// Target 1: <View style={styles.matrix4dCard}> ... </View>
// Let's replace the exact block manually.
const blocksToReplace = [
  {
    start: `<View style={styles.matrix4dCard}>
              <View style={styles.matrix4dCardHeader}>
                <Text style={styles.matrix4dCardTitle}>Pending Actions</Text>`,
    end: `</Text>
              </View>
            </View>`
  },
  {
    start: `<View style={styles.matrix4dCard}>
              <View style={styles.matrix4dCardHeader}>
                <Text style={styles.matrix4dCardTitle}>Treasury Outflow</Text>`,
    end: `</Text>
              </View>
            </View>`
  },
  {
    start: `<View style={styles.matrix4dCard}>
              <View style={styles.matrix4dCardHeader}>
                <Text style={styles.matrix4dCardTitle}>Network Ping</Text>`,
    end: `</Text>
              </View>
            </View>`
  },
  {
    start: `<View style={styles.matrix4dCard}>
              <View style={styles.matrix4dCardHeader}>
                <Text style={styles.matrix4dCardTitle}>Live Admins</Text>`,
    end: `</Text>
              </View>
            </View>`
  }
];

blocksToReplace.forEach(block => {
  let startIndex = content.indexOf(block.start);
  if (startIndex !== -1) {
    let endIndex = content.indexOf(block.end, startIndex);
    if (endIndex !== -1) {
      let fullBlock = content.substring(startIndex, endIndex + block.end.length);
      let newBlock = fullBlock.replace('<View style={styles.matrix4dCard}>', '<Hoverable4DCard style={styles.matrix4dCard}>');
      newBlock = newBlock.substring(0, newBlock.length - 7) + '</Hoverable4DCard>';
      content = content.replace(fullBlock, newBlock);
    }
  }
});

// Target 2: <TouchableOpacity style={[styles.ecoCard, ...]}> ... </TouchableOpacity>
// ecoCards are already TouchableOpacity, we can change them to Hoverable4DCard!
// The ecoCards have onPress, so we should map that too.
const ecoCardRegex = /<TouchableOpacity (style=\{\[styles\.ecoCard[\s\S]*?\} activeOpacity=\{0\.8\} onPress=\{.*?})>([\s\S]*?)<\/TouchableOpacity>/g;
content = content.replace(ecoCardRegex, (match, props, inner) => {
  return \`<Hoverable4DCard \${props}>\${inner}</Hoverable4DCard>\`;
});

// wait, Hoverable4DCard uses Pressable which doesn't support activeOpacity directly.
// Let's strip activeOpacity={0.8}
content = content.replace(/<Hoverable4DCard (.*?) activeOpacity=\{0\.8\}/g, '<Hoverable4DCard $1');

fs.writeFileSync(path, content, 'utf8');
console.log('Success');
