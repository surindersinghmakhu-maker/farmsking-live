import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AreaUnit } from '@/src/types/api';
import { useCreateFarm } from '@/src/hooks/useFarms';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

const theme = RoleThemes.FARMER;
const AREA_UNITS: AreaUnit[] = ['ACRE', 'HECTARE', 'BIGHA', 'GUNTA'];

export default function OnboardingScreen() {
  const router = useRouter();
  const createFarm = useCreateFarm();
  const [farmName, setFarmName] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('ACRE');
  const [irrigationSource, setIrrigationSource] = useState('');
  const [error, setError] = useState<string | null>(null);

  const finish = () => router.replace('/(tabs)');

  const onSaveFarm = async () => {
    setError(null);
    const area = Number(totalArea);
    if (!farmName.trim() || !area || area <= 0) {
      setError('Please enter a farm name and a valid land area, or skip for now.');
      return;
    }
    try {
      await createFarm.mutateAsync({
        name: farmName.trim(),
        totalArea: area,
        areaUnit,
        irrigationSource: irrigationSource.trim() || undefined,
      });
      finish();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save farm. You can add it later.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBadge}>
          <Ionicons name="leaf" size={24} color="#ffffff" />
        </View>
        <Text style={styles.brandName}>FarmsKing</Text>

        <Text style={styles.title}>Tell us about your farm</Text>
        <Text style={styles.subtitle}>Optional — you can always add this later</Text>

        <Text style={styles.label}>Farm Name</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="home-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="e.g. Farm A" placeholderTextColor="#94a3b8" value={farmName} onChangeText={setFarmName} />
        </View>

        <Text style={styles.label}>Total Land Area</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="resize-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 5"
            placeholderTextColor="#94a3b8"
            value={totalArea}
            onChangeText={setTotalArea}
          />
        </View>

        <Text style={styles.label}>Area Unit</Text>
        <View style={styles.unitRow}>
          {AREA_UNITS.map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.unitChip, areaUnit === unit && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              activeOpacity={0.75}
              onPress={() => setAreaUnit(unit)}>
              <Text style={[styles.unitChipText, areaUnit === unit && styles.unitChipTextActive]}>{unit}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Irrigation Source (optional)</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="water-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Borewell, Canal"
            placeholderTextColor="#94a3b8"
            value={irrigationSource}
            onChangeText={setIrrigationSource}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={15} color="#dc2626" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={onSaveFarm} disabled={createFarm.isPending} activeOpacity={0.85} style={styles.button}>
          {createFarm.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save & Continue</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={finish} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: SPACING.xxl, paddingTop: Platform.OS === 'web' ? 44 : 64, alignItems: 'center' },
  brandBadge: {
    width: 52, height: 52, borderRadius: RADIUS.md, backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  brandName: { fontSize: 18, fontFamily: FONT.extraBold, color: theme.primary, letterSpacing: 0.2, marginBottom: 22 },
  title: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a', alignSelf: 'flex-start', letterSpacing: -0.2 },
  subtitle: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.medium, alignSelf: 'flex-start', marginBottom: 20, marginTop: 4 },
  label: { fontSize: 13, color: '#334155', fontFamily: FONT.bold, marginBottom: 7, marginTop: 14 },
  inputWrap: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#eef2f6', borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15.5, fontFamily: FONT.medium, color: '#0f172a' },
  unitRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', width: '100%' },
  unitChip: {
    borderWidth: 1.5,
    borderColor: '#eef2f6',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#f8fafc',
  },
  unitChipText: { color: '#334155', fontSize: 12.5, fontFamily: FONT.semiBold },
  unitChipTextActive: { color: '#fff', fontFamily: FONT.bold },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start' },
  error: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 13 },
  button: {
    width: '100%',
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: FONT.bold },
  skipButton: { alignItems: 'center', marginTop: 16 },
  skipText: { color: '#64748b', fontFamily: FONT.bold },
});
