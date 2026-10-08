const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

// The multi_replace already replaced <View style={styles.matrix4dCard}> with <Hoverable4DCard style={styles.matrix4dCard}> for some cards.
// Let's replace ALL opening tags, just in case:
content = content.replace(/<View style=\{styles\.matrix4dCard\}>/g, '<Hoverable4DCard style={styles.matrix4dCard}>');

// Now we have to replace the EXACT closing tags for these 4 cards.
// These cards have a specific structure:
// <Hoverable4DCard style={styles.matrix4dCard}>
// ... (inner content)
// </View> <- needs to be </Hoverable4DCard>
// Since each card ends with </View> just before the next <Hoverable4DCard> or the closing </View> of matrix4dGrid...

const replaceCardEndings = [
  { 
    search: `</Text>
              </View>
            </View>`,
    replace: `</Text>
              </View>
            </Hoverable4DCard>`
  }
];

replaceCardEndings.forEach(({ search, replace }) => {
  // we replace all instances of this specific signature for the 4 metrics cards
  content = content.split(search).join(replace);
});

// For ecoCard, we want to replace TouchableOpacity with Hoverable4DCard
const ecoCardRegex = /<TouchableOpacity (style=\{\[styles\.ecoCard[\s\S]*?\} onPress=\{.*?})>([\s\S]*?)<\/TouchableOpacity>/g;
content = content.replace(ecoCardRegex, (match, props, inner) => {
  return '<Hoverable4DCard ' + props + '>' + inner + '</Hoverable4DCard>';
});
// remove activeOpacity
content = content.replace(/<Hoverable4DCard(.*?)activeOpacity=\{0\.8\}(.*?)>/g, '<Hoverable4DCard$1$2>');


fs.writeFileSync(path, content, 'utf8');
console.log('Success');
