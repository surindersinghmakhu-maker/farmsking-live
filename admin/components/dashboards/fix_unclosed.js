const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

const blocksToFix = [
  'Action Required\' : \'All Clear\'\\r\\n                </Text>\\r\\n              </View>\\r\\n            </View>',
  'Action Required\' : \'All Clear\'\\n                </Text>\\n              </View>\\n            </View>',
  'T+0 Queue\\r\\n                </Text>\\r\\n              </View>\\r\\n            </View>',
  'T+0 Queue\\n                </Text>\\n              </View>\\n            </View>',
  'Active Chats\\r\\n                </Text>\\r\\n              </View>\\r\\n            </View>',
  'Active Chats\\n                </Text>\\n              </View>\\n            </View>',
  'Immutable Logs\\r\\n                </Text>\\r\\n              </View>\\r\\n            </View>',
  'Immutable Logs\\n                </Text>\\n              </View>\\n            </View>',
];

blocksToFix.forEach(block => {
  if (content.includes(block)) {
    const replacement = block.replace('</View>', '</Hoverable4DCard>');
    content = content.replace(block, replacement);
  }
});

fs.writeFileSync(path, content, 'utf8');
console.log('Success!');
