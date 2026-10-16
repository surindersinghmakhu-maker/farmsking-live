import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import type { AppSettings, UpdateAppSettingsPayload } from '@/src/api/appSettings.api';
import { useExecutiveTheme } from '@/src/store/theme-context';
import * as AppStorage from '@/src/lib/storage';

type SectionKey = 'ALL' | 'THEME' | 'SPRAY_TANKS' | 'MAINTENANCE' | 'TRIAL' | 'VOICE_SYNC' | 'REFERRALS' | 'FEES' | 'RELEASES';

interface SectionTab {
  key: SectionKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

const SECTION_TABS: SectionTab[] = [
  { key: 'ALL', label: 'All Settings', icon: 'grid-outline' },
  { key: 'THEME', label: 'Theme & Colors', icon: 'color-palette-outline', badge: 'Light / Dark' },
  { key: 'SPRAY_TANKS', label: 'Spray Tanks', icon: 'beaker-outline', badge: 'Farm Specs' },
  { key: 'MAINTENANCE', label: 'Maintenance Modes', icon: 'construct-outline', badge: '7 Modes' },
  { key: 'TRIAL', label: 'Trial & Memberships', icon: 'gift-outline' },
  { key: 'VOICE_SYNC', label: 'Voice & WhatsApp', icon: 'mic-outline' },
  { key: 'REFERRALS', label: 'Referral Schemes', icon: 'people-outline' },
  { key: 'FEES', label: 'Gardener & Fees', icon: 'leaf-outline' },
  { key: 'RELEASES', label: 'App Releases', icon: 'cloud-download-outline' },
];

const SPRAY_TANK_STORAGE_KEY = 'farmsking_spray_tank_sizes';
const DEFAULT_SPRAY_TANKS = [15, 16, 20, 25, 50, 100, 200, 500];

export default function SuperSettingsScreen() {
  const { colors, themeMode, setThemeMode, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();
  const { data: remoteSettings, isLoading, refetch } = useAppSettings();
  const updateMutation = useUpdateAppSettings();

  const [activeSection, setActiveSection] = useState<SectionKey>('ALL');
  const [formData, setFormData] = useState<Partial<AppSettings> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [sprayTankSizes, setSprayTankSizes] = useState<number[]>(DEFAULT_SPRAY_TANKS);
  const [newTankInput, setNewTankInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AppStorage.getItemAsync(SPRAY_TANK_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSprayTankSizes(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  const handleAddTankSize = async () => {
    const val = parseInt(newTankInput.trim(), 10);
    if (!val || val <= 0) {
      showToast('⚠️ Please enter a valid tank capacity in liters');
      return;
    }
    if (sprayTankSizes.includes(val)) {
      showToast(`⚠️ ${val}L tank size already exists`);
      return;
    }
    const updated = [...sprayTankSizes, val].sort((a, b) => a - b);
    setSprayTankSizes(updated);
    setNewTankInput('');
    await AppStorage.setItemAsync(SPRAY_TANK_STORAGE_KEY, JSON.stringify(updated));
    showToast(`✅ Added ${val} Liters spray tank option`);
  };

  const handleRemoveTankSize = async (sizeToRemove: number) => {
    if (sprayTankSizes.length <= 1) {
      showToast('⚠️ At least one tank size must remain configured');
      return;
    }
    const updated = sprayTankSizes.filter((s) => s !== sizeToRemove);
    setSprayTankSizes(updated);
    await AppStorage.setItemAsync(SPRAY_TANK_STORAGE_KEY, JSON.stringify(updated));
    showToast(`🗑️ Removed ${sizeToRemove}L tank option`);
  };

  useEffect(() => {
    if (remoteSettings) {
      setFormData({ ...remoteSettings });
    }
  }, [remoteSettings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = async (key: keyof UpdateAppSettingsPayload, val: boolean) => {
    if (!formData) return;
    setFormData((prev) => ({ ...(prev || {}), [key]: val }));
    try {
      await updateMutation.mutateAsync({ [key]: val });
      showToast(`⚡ ${String(key)} updated to ${val ? 'ON' : 'OFF'}`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update toggle');
      refetch();
    }
  };

  const handleFieldChange = (key: keyof UpdateAppSettingsPayload, val: any) => {
    if (!formData) return;
    setFormData((prev) => ({ ...(prev || {}), [key]: val }));
  };

  const handleSaveAll = async () => {
    if (!formData) return;
    try {
      await updateMutation.mutateAsync(formData as UpdateAppSettingsPayload);
      showToast('✅ All infrastructure settings saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to save settings');
    }
  };

  if (isLoading || !formData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={isLight ? '#16a34a' : '#00ff87'} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading Infrastructure Settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderBottomColor: cardBorder }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.crownBadge, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.08)' : 'rgba(0, 255, 135, 0.08)', borderColor: isLight ? 'rgba(22, 163, 74, 0.3)' : 'rgba(0, 255, 135, 0.25)' }]}>
            <Ionicons name="hardware-chip-outline" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.crownText, { color: isLight ? '#16a34a' : '#00ff87' }]}>SYSTEM CONTROLS & THEME</Text>
          </View>
          <Text style={[styles.headerTitle, { color: textColor }]}>System Settings & Infrastructure Controls</Text>
          <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
            Global theme identity, platform maintenance circuit-breakers, free trial policies, voice call, auto-sync, and release parameters.
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Quick 2-Button Global Theme Controller */}
          <View style={[styles.quickThemeSwitch, { backgroundColor: isLight ? '#f1f5f9' : '#020d06', borderColor: cardBorder }]}>
            <TouchableOpacity
              style={[styles.quickThemeBtn, themeMode === 'LIGHT' && styles.quickThemeBtnActiveLight]}
              onPress={() => {
                setThemeMode('LIGHT');
                showToast('☀️ Switched to Crisp Light Theme across entire Admin system');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="sunny" size={14} color={themeMode === 'LIGHT' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8')} />
              <Text style={[styles.quickThemeBtnText, themeMode === 'LIGHT' && { color: '#ffffff', fontWeight: '800' }]}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickThemeBtn, themeMode === 'DARK' && styles.quickThemeBtnActiveDark]}
              onPress={() => {
                setThemeMode('DARK');
                showToast('🌿 Switched to Parrot & Gold Dark Theme across entire Admin system');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="leaf" size={14} color={themeMode === 'DARK' ? '#020d06' : (isLight ? '#64748b' : '#94a3b8')} />
              <Text style={[styles.quickThemeBtnText, themeMode === 'DARK' && { color: '#020d06', fontWeight: '800' }]}>Dark</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
            onPress={handleSaveAll}
            disabled={updateMutation.isPending}
          >
            <LinearGradient
              colors={isLight ? ['#16a34a', '#15803d'] : ['#00ff87', '#00b050']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={17} color={isLight ? '#ffffff' : '#020d06'} />
                  <Text style={[styles.saveBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>Save All Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Toast Alert ───────────────────────────────────────── */}
      {toastMessage && (
        <View style={[styles.toast, isLight && styles.toastLight]}>
          <Ionicons name="sparkles" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.toastText, isLight && { color: '#0f172a' }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Section Pills Tab Bar ──────────────────────────────── */}
      <View style={[styles.tabsWrapper, { backgroundColor: isLight ? '#f8fafc' : '#021008', borderBottomColor: cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {SECTION_TABS.map((tab) => {
            const isSelected = activeSection === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabChip,
                  { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder },
                  isSelected && (isLight ? styles.tabChipSelectedLight : styles.tabChipSelectedDark),
                ]}
                onPress={() => setActiveSection(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isSelected ? (isLight ? '#ffffff' : '#020d06') : (isLight ? '#64748b' : '#94a3b8')}
                />
                <Text
                  style={[
                    styles.tabChipText,
                    { color: isLight ? '#64748b' : '#94a3b8' },
                    isSelected && { color: isLight ? '#ffffff' : '#020d06', fontWeight: '800' },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.badge && (
                  <View
                    style={[
                      styles.tabBadge,
                      { backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)' },
                      isSelected && { backgroundColor: isLight ? 'rgba(255,255,255,0.25)' : 'rgba(2, 13, 6, 0.2)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: isLight ? '#475569' : '#94a3b8' },
                        isSelected && { color: isLight ? '#ffffff' : '#020d06' },
                      ]}
                    >
                      {tab.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Content ──────────────────────────────────────── */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>

        {/* 0. SYSTEM THEME & VISUAL IDENTITY (LIGHT / DARK 2-BUTTON SYSTEM) */}
        {(activeSection === 'ALL' || activeSection === 'THEME') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)' }]}>
                <Ionicons name="color-palette" size={20} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Admin System Theme & Visual Identity</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Central platform-wide theme controller. Switch the entire FarmsKing Admin cockpit between Crisp Light and Parrot & Gold Dark mode.
                </Text>
              </View>
              <View style={{ backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(34, 197, 94, 0.18)', borderWidth: 1, borderColor: isLight ? '#16a34a' : '#fbbf24', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#16a34a' : '#fbbf24' }}>
                  {isLight ? 'Active: ☀️ Crisp Light' : 'Active: 🌿 Parrot & Gold Dark'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              {/* ☀️ Light Theme Button */}
              <TouchableOpacity
                style={[
                  styles.themeSelectCard,
                  { backgroundColor: isLight ? '#ffffff' : '#04180d', borderColor: isLight ? '#16a34a' : cardBorder },
                  themeMode === 'LIGHT' && styles.themeSelectCardActiveLight,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setThemeMode('LIGHT');
                  showToast('☀️ Switched to Crisp Light Theme across entire Admin system');
                }}
              >
                {themeMode === 'LIGHT' && (
                  <View style={styles.themeActiveBadgeLight}>
                    <Ionicons name="checkmark-circle" size={13} color="#ffffff" />
                    <Text style={styles.themeActiveBadgeText}>ACTIVE DEFAULT</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.themeIconCircle, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                    <Ionicons name="sunny" size={24} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.themeCardTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>☀️ Light Mode</Text>
                    <Text style={[styles.themeCardSubtitle, { color: isLight ? '#475569' : '#94a3b8' }]}>
                      Crisp porcelain white with emerald accents, high daytime contrast.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 🌿 Dark Theme Button */}
              <TouchableOpacity
                style={[
                  styles.themeSelectCard,
                  { backgroundColor: isLight ? '#f8fafc' : 'rgba(6, 26, 30, 0.82)', borderColor: !isLight ? '#00ff87' : cardBorder },
                  themeMode === 'DARK' && styles.themeSelectCardActiveDark,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setThemeMode('DARK');
                  showToast('🌿 Switched to Parrot & Gold Dark Theme across entire Admin system');
                }}
              >
                {themeMode === 'DARK' && (
                  <View style={styles.themeActiveBadgeDark}>
                    <Ionicons name="checkmark-circle" size={13} color="#020d06" />
                    <Text style={[styles.themeActiveBadgeText, { color: '#020d06' }]}>ACTIVE</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.themeIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.18)' }]}>
                    <Ionicons name="leaf" size={24} color="#22c55e" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.themeCardTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>🌿 Dark Mode (Parrot & Gold)</Text>
                    <Text style={[styles.themeCardSubtitle, { color: isLight ? '#475569' : '#94a3b8' }]}>
                      Deep cyber obsidian with vivid parrot green & shaded radiant gold.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 1. PLATFORM MAINTENANCE MODES */}
        {(activeSection === 'ALL' || activeSection === 'MAINTENANCE') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="construct" size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Platform Maintenance Modes (Circuit Breakers)</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Pause specific microservices or portals for scheduled updates while keeping the rest of FarmsKing operational.
                </Text>
              </View>
            </View>

            <View style={styles.togglesGrid}>
              <MaintenanceToggleRow
                title="🛍️ Storefront & AgriStore"
                subtitle="Pause shopping cart & order checkout during catalog updates"
                value={Boolean(formData.storefrontMaintenanceMode)}
                onToggle={(val) => handleToggle('storefrontMaintenanceMode', val)}
                innerBg={innerBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
                isLight={isLight}
              />
              <MaintenanceToggleRow
                title="🌾 Agri & Farmer Hub"
                subtitle="Pause farmer bookkeeping & crop intelligence module"
                value={Boolean(formData.agriMaintenanceMode)}
                onToggle={(val) => handleToggle('agriMaintenanceMode', val)}
                innerBg={innerBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
                isLight={isLight}
              />
              <MaintenanceToggleRow
                title="🌸 Garden Care System"
                subtitle="Pause garden advisory & plant nutrition consultations"
                value={Boolean(formData.gardenMaintenanceMode)}
                onToggle={(val) => handleToggle('gardenMaintenanceMode', val)}
                innerBg={innerBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
                isLight={isLight}
              />
              <MaintenanceToggleRow
                title="💳 Wallet & Treasury Payouts"
                subtitle="Pause withdrawal requests & payouts during ledger reconciliation"
                value={Boolean(formData.walletMaintenanceMode)}
                onToggle={(val) => handleToggle('walletMaintenanceMode', val)}
                innerBg={innerBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
                isLight={isLight}
              />
              <MaintenanceToggleRow
                title="🩺 Crop Doctor Consultations"
                subtitle="Pause crop doctor appointment booking & chat scheduling"
                value={Boolean(formData.doctorMaintenanceMode)}
                onToggle={(val) => handleToggle('doctorMaintenanceMode', val)}
                innerBg={innerBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
                isLight={isLight}
              />
              <MaintenanceToggleRow
                title="🌿 Garden Advisor Hub"
                subtitle="Pause garden specialist assignment & profile onboarding"
                value={Boolean(formData.gardenAdvisorMaintenanceMode)}
                onToggle={(val) => handleToggle('gardenAdvisorMaintenanceMode', val)}
                innerBg={innerBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
                isLight={isLight}
              />
              <MaintenanceToggleRow
                title="📊 Financial Accounts & Balance Sheet"
                subtitle="Temporarily restrict accounts exports & tax report generation"
                value={Boolean(formData.accountsMaintenanceMode)}
                onToggle={(val) => handleToggle('accountsMaintenanceMode', val)}
                innerBg={innerBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
                isLight={isLight}
              />
            </View>
          </View>
        )}

        {/* 2. FREE TRIAL & MEMBERSHIP SCHEMES */}
        {(activeSection === 'ALL' || activeSection === 'TRIAL') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)' }]}>
                <Ionicons name="gift" size={20} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Free Membership Demo Trial Scheme</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Configure automated free demo pass duration and tier granted to newly registered farmers.
                </Text>
              </View>
            </View>

            <View style={[styles.toggleRowInline, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: textColor }]}>Enable Free Membership Demo Trial</Text>
                <Text style={[styles.toggleSubtitle, { color: subTextColor }]}>Allow farmers to activate a complimentary demo without payment</Text>
              </View>
              <Switch
                value={Boolean(formData.freeTrialEnabled)}
                onValueChange={(val) => handleToggle('freeTrialEnabled', val)}
                trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Demo Trial Duration (Days)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  value={String(formData.freeTrialDays ?? 10)}
                  onChangeText={(val) => handleFieldChange('freeTrialDays', parseInt(val, 10) || 0)}
                  keyboardType="numeric"
                  placeholder="e.g. 10"
                  placeholderTextColor={subTextColor}
                />
              </View>

              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Complimentary Plan Tier</Text>
                <View style={styles.planSelectorRow}>
                  {(['PRO', 'SMART', 'SUPER'] as const).map((tier) => {
                    const isSelected = (formData.freeTrialPlan || 'SUPER') === tier;
                    return (
                      <TouchableOpacity
                        key={tier}
                        style={[
                          styles.planChip,
                          { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder },
                          isSelected && (isLight ? styles.planChipSelectedLight : styles.planChipSelectedDark),
                        ]}
                        onPress={() => handleFieldChange('freeTrialPlan', tier)}
                      >
                        <Text
                          style={[
                            styles.planChipText,
                            { color: subTextColor },
                            isSelected && { color: isLight ? '#16a34a' : '#00ff87', fontWeight: '800' },
                          ]}
                        >
                          {tier}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 3. VOICE CALL & WHATSAPP GROUP SYNC */}
        {(activeSection === 'ALL' || activeSection === 'VOICE_SYNC') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="mic" size={20} color="#38bdf8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Voice Call & WhatsApp Group Member Sync</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  WebRTC live audio conference rooms and automated WhatsApp community member sync.
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 255, 135, 0.08)', borderWidth: 1, borderColor: isLight ? 'rgba(22, 163, 74, 0.25)' : 'rgba(0, 255, 135, 0.25)', padding: 10, borderRadius: 8, marginHorizontal: 12, marginTop: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Manrope_500Medium', color: isLight ? '#15803d' : '#00ff87' }}>
                💡 API Tokens Note: For Meta Cloud WhatsApp tokens, webhooks, and SMS gateway credentials, configure them directly in C-Panel ➔ Service Integrations.
              </Text>
            </View>

            <View style={[styles.toggleRowInline, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: textColor }]}>🎙️ Group Voice Call Feature</Text>
                <Text style={[styles.toggleSubtitle, { color: subTextColor }]}>Allow Crop Advisors & Admins to host live audio conferences with farmers</Text>
              </View>
              <Switch
                value={Boolean(formData.groupVoiceCallEnabled)}
                onValueChange={(val) => handleToggle('groupVoiceCallEnabled', val)}
                trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={[styles.toggleRowInline, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: textColor }]}>💬 WhatsApp Group Auto-Sync Engine</Text>
                <Text style={[styles.toggleSubtitle, { color: subTextColor }]}>Master toggle for automatic farmer sync into WhatsApp groups</Text>
              </View>
              <Switch
                value={Boolean(formData.whatsappGroupSyncEnabled)}
                onValueChange={(val) => handleToggle('whatsappGroupSyncEnabled', val)}
                trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                thumbColor="#ffffff"
              />
            </View>

            {formData.whatsappGroupSyncEnabled && (
              <View style={[styles.subCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <View style={[styles.toggleRowInline, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, { color: textColor }]}>🟢 Auto-Add Eligible Farmers</Text>
                    <Text style={[styles.toggleSubtitle, { color: subTextColor }]}>Automatically add farmers with active advisor plans</Text>
                  </View>
                  <Switch
                    value={Boolean(formData.whatsappAutoAddEnabled)}
                    onValueChange={(val) => handleToggle('whatsappAutoAddEnabled', val)}
                    trackColor={{ false: '#94a3b8', true: '#22c55e' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={[styles.toggleRowInline, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, { color: textColor }]}>🔴 Auto-Remove Expired Members</Text>
                    <Text style={[styles.toggleSubtitle, { color: subTextColor }]}>Automatically remove members whose advisor plan has expired</Text>
                  </View>
                  <Switch
                    value={Boolean(formData.whatsappAutoRemoveEnabled)}
                    onValueChange={(val) => handleToggle('whatsappAutoRemoveEnabled', val)}
                    trackColor={{ false: '#94a3b8', true: '#ef4444' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>WhatsApp Group JID or Invite Link</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                    value={formData.whatsappGroupJid || ''}
                    onChangeText={(val) => handleFieldChange('whatsappGroupJid', val)}
                    placeholder="https://chat.whatsapp.com/... or 1203630...@g.us"
                    placeholderTextColor={subTextColor}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* 4. REFERRAL & BUSINESS PARTNER SCHEMES */}
        {(activeSection === 'ALL' || activeSection === 'REFERRALS') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="people" size={20} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Referral & Business Partner Schemes</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Set cash bonus amounts for farmer referrals, welcome signup bonuses, and business partner commissions.
                </Text>
              </View>
            </View>

            {/* Farmer Referral Scheme */}
            <View style={[styles.subCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={[styles.toggleRowInline, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: textColor }]}>🌾 Farmer Referral Program Active</Text>
                  <Text style={[styles.toggleSubtitle, { color: subTextColor }]}>Reward farmers when they invite neighbors to FarmsKing</Text>
                </View>
                <Switch
                  value={Boolean(formData.referralOfferSchemeEnabled)}
                  onValueChange={(val) => handleToggle('referralOfferSchemeEnabled', val)}
                  trackColor={{ false: '#94a3b8', true: isLight ? '#16a34a' : '#00ff87' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.colHalf}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Referrer Bonus on Signup (₹)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                    value={String(formData.referralOfferReferrerBonus ?? formData.referralSignupBonusAmount ?? 10)}
                    onChangeText={(val) => {
                      const num = parseFloat(val) || 0;
                      handleFieldChange('referralOfferReferrerBonus', num);
                      handleFieldChange('referralSignupBonusAmount', num);
                    }}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={subTextColor}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>New Farmer Welcome Bonus (₹)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                    value={String(formData.referralOfferNewUserBonus ?? formData.newUserSignupBonusAmount ?? 10)}
                    onChangeText={(val) => {
                      const num = parseFloat(val) || 0;
                      handleFieldChange('referralOfferNewUserBonus', num);
                      handleFieldChange('newUserSignupBonusAmount', num);
                    }}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={subTextColor}
                  />
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.colHalf}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Bonus on First VIP Pass Purchase (₹)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                    value={String(formData.referralOfferPaidPlanBonus ?? formData.referralPaidPlanBonusAmount ?? 50)}
                    onChangeText={(val) => {
                      const num = parseFloat(val) || 0;
                      handleFieldChange('referralOfferPaidPlanBonus', num);
                      handleFieldChange('referralPaidPlanBonusAmount', num);
                    }}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor={subTextColor}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Referral Scheme Name</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                    value={formData.referralOfferSchemeName || 'Kisan Bhaichara Offer'}
                    onChangeText={(val) => handleFieldChange('referralOfferSchemeName', val)}
                    placeholder="Kisan Bhaichara Offer"
                    placeholderTextColor={subTextColor}
                  />
                </View>
              </View>
            </View>

            {/* Business Partner Program */}
            <View style={[styles.subCard, { backgroundColor: innerBg, borderColor: cardBorder, marginTop: 14 }]}>
              <View style={[styles.toggleRowInline, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: textColor }]}>💼 Business Partner Commission Active</Text>
                  <Text style={[styles.toggleSubtitle, { color: subTextColor }]}>Distributor & franchise commission structure</Text>
                </View>
                <Switch
                  value={Boolean(formData.partnerOfferSchemeEnabled)}
                  onValueChange={(val) => handleToggle('partnerOfferSchemeEnabled', val)}
                  trackColor={{ false: '#94a3b8', true: '#f59e0b' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.colHalf}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Partner Commission per Registration (₹)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                    value={String(formData.partnerOfferReferrerBonus ?? formData.partnerReferralCommissionAmount ?? 100)}
                    onChangeText={(val) => {
                      const num = parseFloat(val) || 0;
                      handleFieldChange('partnerOfferReferrerBonus', num);
                      handleFieldChange('partnerReferralCommissionAmount', num);
                    }}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor={subTextColor}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Partner Commission on Paid Plan (₹)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                    value={String(formData.partnerOfferPaidPlanBonus ?? formData.partnerReferralPaidPlanBonusAmount ?? 100)}
                    onChangeText={(val) => {
                      const num = parseFloat(val) || 0;
                      handleFieldChange('partnerOfferPaidPlanBonus', num);
                      handleFieldChange('partnerReferralPaidPlanBonusAmount', num);
                    }}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor={subTextColor}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 5. GARDENER & CERTIFICATION FEES */}
        {(activeSection === 'ALL' || activeSection === 'FEES') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="leaf" size={20} color="#ec4899" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Gardener & Specialist Certification Pricing</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Set exam certification fees and card prices for home garden care & landscape management.
                </Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Advisor Certification Fee (₹)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  value={String(formData.advisorCertificationFee ?? 500)}
                  onChangeText={(val) => handleFieldChange('advisorCertificationFee', parseFloat(val) || 0)}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor={subTextColor}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Garden Platform Commission (%)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  value={String(formData.gardenExpertPlatformFeePercent ?? 20)}
                  onChangeText={(val) => handleFieldChange('gardenExpertPlatformFeePercent', parseFloat(val) || 0)}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={subTextColor}
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Gardener Pro Card Price (₹)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  value={String(formData.gardenerProCardPrice ?? 299)}
                  onChangeText={(val) => handleFieldChange('gardenerProCardPrice', parseFloat(val) || 0)}
                  keyboardType="numeric"
                  placeholder="299"
                  placeholderTextColor={subTextColor}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Gardener VIP Card Price (₹)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  value={String(formData.gardenerVipCardPrice ?? 999)}
                  onChangeText={(val) => handleFieldChange('gardenerVipCardPrice', parseFloat(val) || 0)}
                  keyboardType="numeric"
                  placeholder="999"
                  placeholderTextColor={subTextColor}
                />
              </View>
            </View>
          </View>
        )}

        {/* 6. APP RELEASES & APK DELIVERY */}
        {(activeSection === 'ALL' || activeSection === 'RELEASES') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="cloud-download" size={20} color="#818cf8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>App Releases & Direct APK Distribution</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Provide the live APK direct download link and version number shown to mobile users.
                </Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Latest App Version</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  value={formData.latestAppVersion || '2.0.6'}
                  onChangeText={(val) => handleFieldChange('latestAppVersion', val)}
                  placeholder="e.g. 2.0.6"
                  placeholderTextColor={subTextColor}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Direct APK Download URL</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  value={formData.appDownloadUrl || ''}
                  onChangeText={(val) => handleFieldChange('appDownloadUrl', val)}
                  placeholder="https://farmsking.in/downloads/farmsking.apk"
                  placeholderTextColor={subTextColor}
                />
              </View>
            </View>
          </View>
        )}

        {/* 7. FARM SPRAY TANK CAPACITY MASTER (ADD & REMOVE OPTIONS) */}
        {(activeSection === 'ALL' || activeSection === 'SPRAY_TANKS') && (
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)' }]}>
                <Ionicons name="beaker" size={20} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Farm Spray Tank Capacity Master</Text>
                <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                  Configure standard spray tank sizes (in Liters) available to farmers for accurate medicine & fertilizer dose calculations.
                </Text>
              </View>
            </View>

            {/* Configured Tank Sizes List */}
            <View style={{ gap: 8 }}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Active Spray Tank Capacities</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {sprayTankSizes.map((size) => (
                  <View
                    key={size}
                    style={[
                      styles.tankSizeChip,
                      { backgroundColor: innerBg, borderColor: cardBorder },
                    ]}
                  >
                    <Ionicons name="water-outline" size={14} color={isLight ? '#16a34a' : '#00ff87'} />
                    <Text style={[styles.tankSizeChipText, { color: textColor }]}>{size} Liters</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTankSize(size)}
                      style={styles.tankRemoveBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Add New Tank Size Form */}
            <View style={[styles.subCard, { backgroundColor: innerBg, borderColor: cardBorder, marginTop: 6 }]}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Add New Spray Tank Capacity (Liters)</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextInput
                  style={[
                    styles.inputField,
                    { flex: 1, minWidth: 160, backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor },
                  ]}
                  placeholder="Enter capacity in liters (e.g. 30, 40, 150)"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                  value={newTankInput}
                  onChangeText={setNewTankInput}
                />
                <TouchableOpacity
                  style={[styles.addTankBtn, { backgroundColor: isLight ? '#16a34a' : '#00ff87' }]}
                  onPress={handleAddTankSize}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color={isLight ? '#ffffff' : '#020d06'} />
                  <Text style={[styles.addTankBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>Add Tank Option</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function MaintenanceToggleRow({
  title,
  subtitle,
  value,
  onToggle,
  innerBg,
  cardBorder,
  textColor,
  subTextColor,
  isLight,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  innerBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  isLight: boolean;
}) {
  return (
    <View
      style={[
        styles.maintenanceCard,
        { backgroundColor: innerBg, borderColor: cardBorder },
        value && styles.maintenanceCardActive,
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={[styles.maintenanceTitle, { color: textColor }]}>{title}</Text>
          <View style={[styles.statusBadge, value ? styles.statusBadgeUnderMaintenance : (isLight ? styles.statusBadgeLiveLight : styles.statusBadgeLive)]}>
            <View style={[styles.statusDot, value ? { backgroundColor: '#ef4444' } : { backgroundColor: isLight ? '#16a34a' : '#00ff87' }]} />
            <Text style={[styles.statusBadgeText, value ? { color: '#ef4444' } : { color: isLight ? '#16a34a' : '#00ff87' }]}>
              {value ? 'UNDER MAINTENANCE' : 'OPERATIONAL'}
            </Text>
          </View>
        </View>
        <Text style={[styles.maintenanceSubtitle, { color: subTextColor }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#94a3b8', true: '#ef4444' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 220,
  },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6,
  },
  crownText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickThemeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 9,
    borderWidth: 1,
    gap: 4,
  },
  quickThemeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickThemeBtnActiveLight: {
    backgroundColor: '#16a34a',
  },
  quickThemeBtnActiveDark: {
    backgroundColor: '#00ff87',
  },
  quickThemeBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 9,
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  toast: {
    position: 'absolute',
    top: 90,
    right: 24,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#00ff87',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#00ff87',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  toastText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  tabsWrapper: {
    borderBottomWidth: 1,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabChipSelectedLight: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  tabChipSelectedDark: {
    backgroundColor: '#00ff87',
    borderColor: '#00ff87',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 14,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 10,
    flexWrap: 'wrap',
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  themeSelectCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    position: 'relative',
  },
  themeSelectCardActiveLight: {
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  themeSelectCardActiveDark: {
    borderColor: '#00ff87',
    shadowColor: '#00ff87',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  themeActiveBadgeLight: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 5,
  },
  themeActiveBadgeDark: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#00ff87',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 5,
  },
  themeActiveBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  themeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  themeCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  togglesGrid: {
    gap: 8,
  },
  maintenanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 9,
    borderWidth: 1,
    padding: 10,
  },
  maintenanceCardActive: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  maintenanceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  maintenanceSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeLive: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  statusBadgeLiveLight: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  statusBadgeUnderMaintenance: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toggleRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 9,
    borderWidth: 1,
    padding: 10,
  },
  toggleTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
  },
  subCard: {
    borderRadius: 9,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colHalf: {
    flex: 1,
    minWidth: 200,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputField: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  planSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  planChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  planChipSelectedLight: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  planChipSelectedDark: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
  },
  planChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tankSizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  tankSizeChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  tankRemoveBtn: {
    marginLeft: 2,
  },
  addTankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addTankBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
