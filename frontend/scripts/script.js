const fs = require('fs');
let code = fs.readFileSync('d:/FarmsKing/frontend/app/(admin)/(tabs)/super-settings.tsx', 'utf8');

const newPanel = 
function GardenSettingsPanel() {
  const { data: settings } = useAppSettings();
  const updateSettings = useUpdateAppSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [feePercent, setFeePercent] = useState('20');
  const [proPrice, setProPrice] = useState('299');
  const [vipPrice, setVipPrice] = useState('999');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFeePercent(String(settings.gardenExpertPlatformFeePercent ?? 20));
      setProPrice(String(settings.gardenerProCardPrice ?? 299));
      setVipPrice(String(settings.gardenerVipCardPrice ?? 999));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({
        gardenExpertPlatformFeePercent: parseFloat(feePercent),
        gardenerProCardPrice: parseFloat(proPrice),
        gardenerVipCardPrice: parseFloat(vipPrice),
      });
      alert('Garden Settings saved successfully.');
    } catch (err) {
      alert('Failed to save garden settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, { borderColor: '#fcd34d', borderWidth: 1.5 }, premiumShadow('#000000', 'sm')]}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setIsCollapsed(!isCollapsed)} activeOpacity={0.7}>
        <View style={[styles.iconCircle, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="leaf" size={22} color="#ffffff" />
        </View>
        <Text style={styles.cardTitle}>Garden VIP Cards & Experts</Text>
        <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={24} color="#94a3b8" />
      </TouchableOpacity>
      
      {!isCollapsed && (
        <View style={styles.cardBody}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PRO Card Price (?)</Text>
            <TextInput style={styles.textInput} keyboardType="numeric" value={proPrice} onChangeText={setProPrice} placeholder="e.g. 299" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>VIP Card Price (?)</Text>
            <TextInput style={styles.textInput} keyboardType="numeric" value={vipPrice} onChangeText={setVipPrice} placeholder="e.g. 999" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Garden Expert Platform Fee (%)</Text>
            <TextInput style={styles.textInput} keyboardType="numeric" value={feePercent} onChangeText={setFeePercent} placeholder="e.g. 20" />
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled, { backgroundColor: '#f59e0b' }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Garden Settings</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
;

code = code.replace('function ECommerceSettingsPanel() {', newPanel + '\n\nfunction ECommerceSettingsPanel() {');
code = code.replace('<ECommerceSettingsPanel />', '<GardenSettingsPanel />\n          <ECommerceSettingsPanel />');

fs.writeFileSync('d:/FarmsKing/frontend/app/(admin)/(tabs)/super-settings.tsx', code);
