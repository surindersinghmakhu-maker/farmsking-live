const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

// The matrix4dCard end tag is followed by spaces and then another <Hoverable4DCard or </View>
// Let's just fix it by looking for "Action Required' : 'All Clear'\\n                </Text>\\n              </View>\\n            </View>"
// But ignoring \\r or \\n
content = content.replace(/All Clear'[\s\n\r]*<\/Text>[\s\n\r]*<\/View>[\s\n\r]*<\/View>/g, "All Clear'\\n                </Text>\\n              </View>\\n            </Hoverable4DCard>");

content = content.replace(/T\+0 Queue[\s\n\r]*<\/Text>[\s\n\r]*<\/View>[\s\n\r]*<\/View>/g, "T+0 Queue\\n                </Text>\\n              </View>\\n            </Hoverable4DCard>");

content = content.replace(/Active Chats[\s\n\r]*<\/Text>[\s\n\r]*<\/View>[\s\n\r]*<\/View>/g, "Active Chats\\n                </Text>\\n              </View>\\n            </Hoverable4DCard>");

content = content.replace(/Immutable Logs[\s\n\r]*<\/Text>[\s\n\r]*<\/View>[\s\n\r]*<\/View>/g, "Immutable Logs\\n                </Text>\\n              </View>\\n            </Hoverable4DCard>");

fs.writeFileSync(path, content, 'utf8');
console.log('Success!');
