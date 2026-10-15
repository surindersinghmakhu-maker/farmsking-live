import { useState, useEffect } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AreaUnit } from '@/src/types/api';
import { useCreateFarm } from '@/src/hooks/useFarms';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAuth } from '@/src/store/auth-context';
import { WelcomeBonusModal } from '@/src/components/WelcomeBonusModal';

const theme = RoleThemes.FARMER;
const AREA_UNITS: AreaUnit[] = ['ACRE', 'HECTARE', 'BIGHA', 'GUNTA'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const { user } = useAuth();
  const createFarm = useCreateFarm();
  const [showWelcomeModal, setShowWelcomeModal] = useState(!!user?.referredById);
  const [farmName, setFarmName] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('ACRE');
  const [irrigationSource, setIrrigationSource] = useState('');
  const [error, setError] = useState<string | null>(null);

  const finish = () => router.replace('/(tabs)' as any);

  useEffect(() => {
    if (user?.role === 'CUSTOMER' && (!user.roles || user.roles.length <= 1 || (user.roles.length === 1 && user.roles[0] === 'CUSTOMER'))) {
      finish();
    }
  }, [user]);

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
      {/* Ambient background glowing orbs */}
      <View style={styles.glowOrbMint} pointerEvents="none" />
      <View style={styles.glowOrbBlue} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Card Container */}
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          <View style={styles.headerRow}>
            <BrandLogo size={46} useHdQuality />
            <View>
              <Text style={styles.brandName}>FarmsKing</Text>
              <Text style={styles.brandSubtitle}>Farm Profile Setup</Text>
            </View>
          </View>

          <Text style={styles.title}>Tell us about your farm</Text>
          <Text style={styles.subtitle}>Optional — you can configure your crop telemetry anytime.</Text>

          <Text style={styles.label}>Farm / Plot Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="leaf-outline" size={18} color="#059669" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Makhu Organic Farm"
              placeholderTextColor="#94a3b8"
              value={farmName}
              onChangeText={setFarmName}
            />
          </View>

          <Text style={styles.label}>Total Land Area</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="resize-outline" size={18} color="#059669" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 5"
              placeholderTextColor="#94a3b8"
              value={totalArea}
              onChangeText={setTotalArea}
            />
          </View>

          <Text style={styles.label}>Land Measurement Unit</Text>
          <View style={styles.unitRow}>
            {AREA_UNITS.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unitChip,
                  areaUnit === unit && styles.unitChipActive,
                ]}
                activeOpacity={0.75}
                onPress={() => setAreaUnit(unit)}
              >
                <Text
                  style={[
                    styles.unitChipText,
                    areaUnit === unit && styles.unitChipTextActive,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Primary Irrigation Source (Optional)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="water-outline" size={18} color="#059669" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Tube well, Canal, Drip Irrigation"
              placeholderTextColor="#94a3b8"
              value={irrigationSource}
              onChangeText={setIrrigationSource}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={15} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={onSaveFarm}
            disabled={createFarm.isPending}
            activeOpacity={0.85}
            style={[styles.primaryButton, createFarm.isPending && { opacity: 0.7 }]}
          >
            {createFarm.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.buttonText}>Save & Proceed</Text>
                <Ionicons name="arrow-forward" size={17} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={finish} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <WelcomeBonusModal visible={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#031a16',
    position: 'relative',
  },
  glowOrbMint: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    ...(Platform.OS === 'web' ? { filter: 'blur(90px)' } : {}),
  },
  glowOrbBlue: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingVertical: 48,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(16, 185, 129, 0.1)',
        }
      : {
          elevation: 10,
        }),
  },
  cardMobile: {
    padding: 22,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#064e3b',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  title: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT.medium,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 12.5,
    color: '#1e293b',
    fontFamily: FONT.bold,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  unitChip: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#f8fafc',
  },
  unitChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  unitChipText: {
    color: '#475569',
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
  },
  unitChipTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#b91c1c',
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: RADIUS.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  skipText: {
    color: '#64748b',
    fontFamily: FONT.bold,
    fontSize: 13,
  },
});
