const fs = require('fs');
const path = 'd:/FarmsKing/admin/components/dashboards/SuperAdminDashboardView.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "historyTotal === 0 ? (";
const endStr = ") : null}";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacementStr = `historyTotal === 0 ? (
                <Text style={styles.emptyText}>No resolved history records yet.</Text>
              ) : (
                <View style={{ width: '100%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,255,135,0.2)' }}>
                  {/* Table Header */}
                  <View style={{ flexDirection: 'row', backgroundColor: 'rgba(6,36,19,0.8)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,135,0.3)', paddingVertical: 12, paddingHorizontal: 16 }}>
                     <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Entity Type</Text>
                     <Text style={{ flex: 2, fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Name / ID</Text>
                     <Text style={{ flex: 3, fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Action / Event</Text>
                     <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Status</Text>
                  </View>
                  
                  {/* Table Body */}
                  <View style={{ backgroundColor: 'rgba(2,13,6,0.6)' }}>
                    {resolvedRequests.map((req, index) => (
                      <View key={req.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,135,0.1)', paddingVertical: 14, paddingHorizontal: 16 }}>
                        <Text style={{ flex: 1, fontSize: 12, fontFamily: FONT.bold, color: '#00ff87' }}>👨‍🌾 Farmer</Text>
                        <Text style={{ flex: 2, fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>{req.farmerName}</Text>
                        <Text style={{ flex: 3, fontSize: 11, color: '#cbd5e1' }} numberOfLines={1}>{req.comment}</Text>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                           <View style={{ backgroundColor: 'rgba(0,255,135,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,255,135,0.3)' }}>
                              <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#00ff87' }}>RESOLVED</Text>
                           </View>
                        </View>
                      </View>
                    ))}
                    {processedWithdrawals.map((w, index) => (
                      <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,135,0.1)', paddingVertical: 14, paddingHorizontal: 16 }}>
                        <Text style={{ flex: 1, fontSize: 12, fontFamily: FONT.bold, color: '#10b981' }}>💳 Wallet</Text>
                        <Text style={{ flex: 2, fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>{w.farmerName || 'User'}</Text>
                        <Text style={{ flex: 3, fontSize: 11, color: '#cbd5e1' }} numberOfLines={1}>₹{w.amount} Withdrawal Processed</Text>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                           <View style={{ backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}>
                              <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#10b981' }}>{w.status}</Text>
                           </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )
            ) : null}`;
            
  content = content.substring(0, startIndex) + replacementStr + content.substring(endIndex + endStr.length);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} else {
  console.log('Failed', startIndex, endIndex);
}
