import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/store/auth-context';
import { useUpdateMyAddress } from '@/src/hooks/useAdvisorProfile';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateAddress = useUpdateMyAddress();
  const theme = RoleThemes[user?.role === 'ADVISOR' ? 'FARM_ADVISOR' : 'FARMER'] ?? RoleThemes.FARMER;

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
  const [whatsappGroupEnabled, setWhatsappGroupEnabled] = useState(user?.whatsappGroupEnabled ?? true);

  const [rainEnabled, setRainEnabled] = useState(user?.weatherAlertRainEnabled ?? false);
  const [minTempEnabled, setMinTempEnabled] = useState(user?.weatherAlertMinTempC != null);
  const [minTempValue, setMinTempValue] = useState(user?.weatherAlertMinTempC != null ? String(user.weatherAlertMinTempC) : '');
  const [maxTempEnabled, setMaxTempEnabled] = useState(user?.weatherAlertMaxTempC != null);
  const [maxTempValue, setMaxTempValue] = useState(user?.weatherAlertMaxTempC != null ? String(user.weatherAlertMaxTempC) : '');

  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const toggleNotifications = (value: boolean) => {
    tap();
    setNotificationsEnabled(value);
  };

  const handleSave = async () => {
    tap();
    setError(null);
    setIsSaved(false);

    if (minTempEnabled && minTempValue.trim() === '') {
      setError('Enter a minimum temperature or turn it off.');
      return;
    }
    if (maxTempEnabled && maxTempValue.trim() === '') {
      setError('Enter a maximum temperature or turn it off.');
      return;
    }
    const minTemp = minTempEnabled ? Number(minTempValue) : null;
    const maxTemp = maxTempEnabled ? Number(maxTempValue) : null;
    if (minTempEnabled && Number.isNaN(minTemp)) {
      setError('Minimum temperature must be a number.');
      return;
    }
    if (maxTempEnabled && Number.isNaN(maxTemp)) {
      setError('Maximum temperature must be a number.');
      return;
    }
    if (minTemp != null && maxTemp != null && minTemp > maxTemp) {
      setError('Minimum temperature cannot be higher than maximum.');
      return;
    }

    try {
      await updateAddress.mutateAsync({
        notificationsEnabled,
        whatsappGroupEnabled,
        weatherAlertRainEnabled: rainEnabled,
        weatherAlertMinTempC: minTemp,
        weatherAlertMaxTempC: maxTemp,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save your settings.');
    }
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={theme.gradient} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={[styles.rowIconBg, { backgroundColor: theme.primaryLight ?? '#f0fdf4' }]}>
              <Ionicons name="notifications-outline" size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowSubLabel}>Reminders, payments, messages & updates</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── WhatsApp Advisor Group Consent Switch (ON by Default) ── */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={[styles.rowIconBg, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="logo-whatsapp" size={16} color="#25d366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>WhatsApp Advisor Group (ਜੋੜੋ / ਸ਼ਾਮਲ ਹੋਵੋ)</Text>
              <Text style={styles.rowSubLabel}>
                {whatsappGroupEnabled
                  ? 'Auto-join official Advisor WhatsApp group for live advice & updates'
                  : 'Opted out. You will be removed from the WhatsApp group'}
              </Text>
            </View>
            <Switch
              value={whatsappGroupEnabled}
              onValueChange={(val) => {
                tap();
                setWhatsappGroupEnabled(val);
              }}
              trackColor={{ false: '#cbd5e1', true: '#25d366' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="partly-sunny-outline" size={18} color={theme.primary} />
            <Text style={styles.sectionTitle}>Weather Setup</Text>
          </View>
          <Text style={styles.sectionSub}>Get alerted only when weather crosses limits you set.</Text>

          <View style={styles.rowBetween}>
            <View style={[styles.rowIconBg, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="rainy-outline" size={16} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Rain Alert</Text>
              <Text style={styles.rowSubLabel}>Notify me when rain is expected</Text>
            </View>
            <Switch
              value={rainEnabled}
              onValueChange={(v) => { tap(); setRainEnabled(v); }}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={[styles.rowIconBg, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="snow-outline" size={16} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Minimum Temperature Alert</Text>
              <Text style={styles.rowSubLabel}>Notify me when it drops below this</Text>
            </View>
            <Switch
              value={minTempEnabled}
              onValueChange={(v) => { tap(); setMinTempEnabled(v); }}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
          {minTempEnabled ? (
            <View style={styles.tempInputRow}>
              <TextInput
                style={styles.tempInput}
                placeholder="e.g. 10"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={minTempValue}
                onChangeText={setMinTempValue}
              />
              <Text style={styles.tempUnit}>°C</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={[styles.rowIconBg, { backgroundColor: '#ffedd5' }]}>
              <Ionicons name="sunny-outline" size={16} color="#ea580c" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Maximum Temperature Alert</Text>
              <Text style={styles.rowSubLabel}>Notify me when it goes above this</Text>
            </View>
            <Switch
              value={maxTempEnabled}
              onValueChange={(v) => { tap(); setMaxTempEnabled(v); }}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
          {maxTempEnabled ? (
            <View style={styles.tempInputRow}>
              <TextInput
                style={styles.tempInput}
                placeholder="e.g. 38"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={maxTempValue}
                onChangeText={setMaxTempValue}
              />
              <Text style={styles.tempUnit}>°C</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {isSaved ? (
            <View style={styles.savedNotice}>
              <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
              <Text style={styles.savedNoticeText}>Settings saved successfully!</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={updateAddress.isPending}
          >
            {updateAddress.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingTop: Platform.OS === 'web' ? 18 : 44,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 17, fontFamily: FONT.extraBold },
  scrollContent: { padding: SPACING.md, paddingBottom: 32, alignItems: 'center' },
  card: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...premiumShadow('#0f172a', 'sm') },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  sectionSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rowIconBg: { width: 32, height: 32, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  rowSubLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  tempInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginLeft: 42 },
  tempInput: { flex: 1, maxWidth: 120, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  tempUnit: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12.5, marginTop: 12 },
  savedNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', padding: 8, borderRadius: RADIUS.md, marginTop: 12 },
  savedNoticeText: { color: '#16a34a', fontSize: 12, fontFamily: FONT.bold },
  saveBtn: { marginTop: 14, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14.5, fontFamily: FONT.bold },
});
