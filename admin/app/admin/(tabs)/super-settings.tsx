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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSystemIntegrations, useUpdateSystemIntegrations } from '@/src/hooks/useSystemIntegrations';
import {
  SystemIntegrationsConfig,
  mergeSystemIntegrationsWithDefaults,
  SupportedPaymentGateway,
} from '@/src/api/appSettings.api';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

type ToolCategory =
  | 'AI'
  | 'PAYMENTS'
  | 'SMS'
  | 'WHATSAPP'
  | 'SATELLITE'
  | 'WEATHER'
  | 'LOGISTICS'
  | 'PUSH';

interface CategoryFilter {
  key: ToolCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  { key: 'AI', label: 'AI Intelligence & Crop Doctor', icon: 'sparkles-outline' },
  { key: 'PAYMENTS', label: 'Payment Gateway & Checkout', icon: 'card-outline' },
  { key: 'SMS', label: 'SMS & OTP Service', icon: 'chatbox-ellipses-outline' },
  { key: 'WHATSAPP', label: 'WhatsApp Business Bot', icon: 'logo-whatsapp' },
  { key: 'SATELLITE', label: 'Satellite Farm Radar', icon: 'planet-outline' },
  { key: 'WEATHER', label: 'Weather & Spray Forecast', icon: 'partly-sunny-outline' },
  { key: 'LOGISTICS', label: 'Courier & Logistics', icon: 'cube-outline' },
  { key: 'PUSH', label: 'Push Notifications (FCM)', icon: 'notifications-outline' },
];

export default function SuperSettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 768));
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  const { data: remoteConfig, isLoading, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [localConfig, setLocalConfig] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(remoteConfig)
  );
  const [activeFilter, setActiveFilter] = useState<ToolCategory>('AI');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (remoteConfig) {
      setLocalConfig(mergeSystemIntegrationsWithDefaults(remoteConfig));
    }
  }, [remoteConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleShowSecret = (fieldKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleToggleTool = async (category: keyof SystemIntegrationsConfig, toolName: string) => {
    const currentVal = (localConfig[category] as any)?.isEnabled ?? true;
    const newVal = !currentVal;

    const updated = {
      ...localConfig,
      [category]: {
        ...(localConfig[category] as any),
        isEnabled: newVal,
      },
    };
    setLocalConfig(updated);

    try {
      await updateMutation.mutateAsync({
        [category]: {
          ...(localConfig[category] as any),
          isEnabled: newVal,
        },
      });
      showToast(`⚡ ${toolName} is now ${newVal ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update tool state');
      refetch();
    }
  };

  const handleUpdateField = (category: keyof SystemIntegrationsConfig, providerKey: string, field: string, value: string) => {
    setLocalConfig((prev) => {
      const cat = (prev[category] as any) || {};
      const providers = cat.providers || {};
      const target = providers[providerKey] || {};
      return {
        ...prev,
        [category]: {
          ...cat,
          providers: {
            ...providers,
            [providerKey]: {
              ...target,
              [field]: value,
            },
          },
        },
      };
    });
  };

  const handleSetProvider = (category: keyof SystemIntegrationsConfig, providerKey: string) => {
    setLocalConfig((prev) => {
      const cat = (prev[category] as any) || {};
      return {
        ...prev,
        [category]: {
          ...cat,
          activeProvider: providerKey,
        },
      };
    });
  };

  const handleSetGateway = (gateway: SupportedPaymentGateway) => {
    setLocalConfig((prev) => ({
      ...prev,
      gateway: {
        ...prev.gateway,
        activeGateway: gateway,
      },
    }));
  };

  const handleToggleSandbox = async (isSandbox: boolean) => {
    setLocalConfig((prev) => ({
      ...prev,
      gateway: {
        ...prev.gateway,
        isSandbox,
      },
    }));
    try {
      await updateMutation.mutateAsync({
        gateway: {
          ...localConfig.gateway,
          isSandbox,
        },
      });
      showToast(`⚡ Payment mode switched to ${isSandbox ? 'SANDBOX TEST' : 'LIVE PRODUCTION'}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to switch payment mode');
    }
  };

  const handleSaveTool = async (category: keyof SystemIntegrationsConfig, toolName: string) => {
    try {
      await updateMutation.mutateAsync({
        [category]: localConfig[category],
      });
      showToast(`✅ ${toolName} settings saved successfully!`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || `Failed to save ${toolName} settings`);
    }
  };

  if (isLoading || !localConfig) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={isLight ? '#16a34a' : '#00ff87'} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading API Tools & Services...</Text>
      </View>
    );
  }

  const selectedCategory = CATEGORY_FILTERS.find((c) => c.key === activeFilter) || CATEGORY_FILTERS[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderBottomColor: cardBorder }]}>
        <View style={styles.headerInfo}>
          <View style={[styles.badge, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.08)' : 'rgba(0, 255, 135, 0.08)', borderColor: isLight ? 'rgba(22, 163, 74, 0.25)' : 'rgba(0, 255, 135, 0.25)' }]}>
            <Ionicons name="hardware-chip-outline" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.badgeText, { color: isLight ? '#16a34a' : '#00ff87' }]}>TOOL & API ACTIVATOR</Text>
          </View>
          <Text style={[styles.headerTitle, { color: textColor }]}>Platform Tools & Services</Text>
          <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
            Select a tool from the dropdown to configure credentials and toggle activation.
          </Text>
        </View>
      </View>

      {/* ── Toast Alert ─────────────────────────────────────────── */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: isLight ? '#f0fdf4' : '#062814', borderColor: isLight ? '#bbf7d0' : '#00ff87' }]}>
          <Ionicons name="sparkles" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.toastText, { color: textColor }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Category Dropdown Selector (Without "All Tools" Option) ── */}
      <View style={[styles.filterBar, { backgroundColor: isLight ? '#f8fafc' : '#021008', borderBottomColor: cardBorder, zIndex: 100 }]}>
        <View style={styles.dropdownContainer}>
          <Text style={[styles.filterLabel, { color: subTextColor }]}>Select Tool:</Text>
          <View style={styles.dropdownRelativeBox}>
            <TouchableOpacity
              style={[styles.dropdownTrigger, { backgroundColor: isLight ? '#ffffff' : '#04170c', borderColor: cardBorder }]}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons name={selectedCategory.icon} size={16} color={isLight ? '#16a34a' : '#00ff87'} />
                <Text style={[styles.dropdownSelectedText, { color: textColor }]}>
                  {selectedCategory.label}
                </Text>
              </View>
              <Ionicons
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={subTextColor}
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                {CATEGORY_FILTERS.map((cat) => {
                  const isSelected = activeFilter === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.dropdownItem,
                        isSelected && (isLight ? styles.dropdownItemActiveLight : styles.dropdownItemActiveDark),
                      ]}
                      onPress={() => {
                        setActiveFilter(cat.key);
                        setIsDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownItemLeft}>
                        <Ionicons
                          name={cat.icon}
                          size={16}
                          color={isSelected ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                        />
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: isSelected ? (isLight ? '#16a34a' : '#00ff87') : textColor },
                            isSelected && { fontWeight: '700' },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Single Active Tool Card Workspace ──────────────────── */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
          {/* 1. AI Vision & Crop Doctor */}
          {activeFilter === 'AI' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Ionicons name="sparkles" size={22} color="#10b981" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>AI Crop Doctor & Vision</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.ai?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.ai?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.ai?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Multimodal neural leaf pathology and smart agronomy chat.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.ai?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('ai', 'AI Crop Doctor')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Active AI Engine:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'GEMINI', label: 'Google Gemini' },
                    { key: 'OPENAI', label: 'OpenAI GPT-4' },
                    { key: 'CLAUDE', label: 'Anthropic Claude' },
                  ].map((p) => {
                    const isSelected = localConfig.ai?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelected,
                        ]}
                        onPress={() => handleSetProvider('ai', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#10b981' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Key Inputs */}
              {localConfig.ai?.activeProvider === 'GEMINI' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.inputLabel, { color: subTextColor }]}>Gemini API Key</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder="Enter Google AI Studio API Key..."
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showSecrets['gemini_key']}
                      value={localConfig.ai?.providers?.gemini?.apiKey || ''}
                      onChangeText={(val) => handleUpdateField('ai', 'gemini', 'apiKey', val)}
                    />
                    <TouchableOpacity onPress={() => toggleShowSecret('gemini_key')}>
                      <Ionicons
                        name={showSecrets['gemini_key'] ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={subTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.fieldHint, { color: subTextColor }]}>
                    Model: {localConfig.ai?.providers?.gemini?.model || 'gemini-1.5-flash'}
                  </Text>
                </View>
              )}

              {localConfig.ai?.activeProvider === 'OPENAI' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.inputLabel, { color: subTextColor }]}>OpenAI API Secret Key</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder="sk-..."
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showSecrets['openai_key']}
                      value={localConfig.ai?.providers?.openai?.apiKey || ''}
                      onChangeText={(val) => handleUpdateField('ai', 'openai', 'apiKey', val)}
                    />
                    <TouchableOpacity onPress={() => toggleShowSecret('openai_key')}>
                      <Ionicons
                        name={showSecrets['openai_key'] ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={subTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {localConfig.ai?.activeProvider === 'CLAUDE' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.inputLabel, { color: subTextColor }]}>Anthropic Claude API Key</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder="sk-ant-..."
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showSecrets['claude_key']}
                      value={localConfig.ai?.providers?.claude?.apiKey || ''}
                      onChangeText={(val) => handleUpdateField('ai', 'claude', 'apiKey', val)}
                    />
                    <TouchableOpacity onPress={() => toggleShowSecret('claude_key')}>
                      <Ionicons
                        name={showSecrets['claude_key'] ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={subTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('ai', 'AI Vision & Crop Doctor')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={isLight ? ['#16a34a', '#15803d'] : ['#00ff87', '#00b050']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color={isLight ? '#ffffff' : '#020d06'} />
                    <Text style={[styles.toolSaveBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>
                      Save AI Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 2. Payment Gateway */}
          {activeFilter === 'PAYMENTS' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                    <Ionicons name="card" size={22} color="#0284c7" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Payment Gateway</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.gateway?.isSandbox ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.gateway?.isSandbox ? '#f59e0b' : '#10b981' }]}>
                          {localConfig.gateway?.isSandbox ? 'SANDBOX TEST' : 'LIVE PRODUCTION'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Customer checkout, UPI direct QR, and automated settlements.
                    </Text>
                  </View>
                </View>
                <View style={styles.sandboxToggleRow}>
                  <Text style={[styles.modeLabel, { color: subTextColor }]}>Sandbox</Text>
                  <Switch
                    value={localConfig.gateway?.isSandbox ?? true}
                    onValueChange={handleToggleSandbox}
                    trackColor={{ false: '#10b981', true: '#f59e0b' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Gateway Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Active Gateway:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'RAZORPAY', label: 'Razorpay' },
                    { key: 'CASHFREE', label: 'Cashfree' },
                    { key: 'PHONEPE', label: 'PhonePe' },
                    { key: 'UPI_DIRECT', label: 'Direct UPI (0% Fee)' },
                  ].map((g) => {
                    const isSelected = localConfig.gateway?.activeGateway === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedBlue,
                        ]}
                        onPress={() => handleSetGateway(g.key as SupportedPaymentGateway)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#0284c7' : textColor }]}>
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Gateway Inputs */}
              {localConfig.gateway?.activeGateway === 'RAZORPAY' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Razorpay Key ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="rzp_live_..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.razorpay?.keyId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'razorpay', 'keyId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Razorpay Key Secret</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Key Secret..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['rzp_sec']}
                          value={localConfig.gateway?.providers?.razorpay?.keySecret || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'razorpay', 'keySecret', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('rzp_sec')}>
                          <Ionicons
                            name={showSecrets['rzp_sec'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.gateway?.activeGateway === 'CASHFREE' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Cashfree App ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="App ID..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.cashfree?.appId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'cashfree', 'appId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Secret Key</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Secret Key..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['cf_sec']}
                          value={localConfig.gateway?.providers?.cashfree?.secretKey || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'cashfree', 'secretKey', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('cf_sec')}>
                          <Ionicons
                            name={showSecrets['cf_sec'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.gateway?.activeGateway === 'PHONEPE' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Merchant ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="M22KMYD10AWD8..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.phonepe?.merchantId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'phonepe', 'merchantId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Salt Key</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Salt key..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['pp_salt']}
                          value={localConfig.gateway?.providers?.phonepe?.saltKey || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'phonepe', 'saltKey', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('pp_salt')}>
                          <Ionicons
                            name={showSecrets['pp_salt'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.gateway?.activeGateway === 'UPI_DIRECT' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>UPI ID (VPA)</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="username@okaxis..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.upiDirect?.upiId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'upiDirect', 'upiId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Payee Business Name</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="FarmsKing Technologies Pvt Ltd"
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.upiDirect?.payeeName || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'upiDirect', 'payeeName', val)}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('gateway', 'Payment Gateway')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#0284c7', '#0369a1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Payment Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 3. SMS & OTP */}
          {activeFilter === 'SMS' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                    <Ionicons name="chatbox-ellipses" size={22} color="#6366f1" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>SMS & Phone OTP</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.sms?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.sms?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.sms?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Login verification codes and transaction SMS alerts.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.sms?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('sms', 'SMS Gateway')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Active SMS Gateway:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'FIREBASE', label: 'Firebase Phone' },
                    { key: 'FAST2SMS', label: 'Fast2SMS' },
                    { key: 'MSG91', label: 'MSG91' },
                    { key: 'TWILIO', label: 'Twilio' },
                  ].map((p) => {
                    const isSelected = localConfig.sms?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedIndigo,
                        ]}
                        onPress={() => handleSetProvider('sms', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#6366f1' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Fields */}
              {localConfig.sms?.activeProvider === 'FAST2SMS' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Fast2SMS API Key</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Fast2SMS Key..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['fast2sms_key']}
                          value={localConfig.sms?.providers?.fast2sms?.apiKey || ''}
                          onChangeText={(val) => handleUpdateField('sms', 'fast2sms', 'apiKey', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('fast2sms_key')}>
                          <Ionicons
                            name={showSecrets['fast2sms_key'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Sender ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="FRMKNG"
                          placeholderTextColor={subTextColor}
                          value={localConfig.sms?.providers?.fast2sms?.senderId || 'FRMKNG'}
                          onChangeText={(val) => handleUpdateField('sms', 'fast2sms', 'senderId', val)}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.sms?.activeProvider === 'FIREBASE' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.fieldHint, { color: subTextColor }]}>
                    Firebase Phone Auth is active and integrated with Google Play Services.
                  </Text>
                </View>
              )}

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('sms', 'SMS & OTP Service')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save SMS Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 4. WhatsApp Business */}
          {activeFilter === 'WHATSAPP' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 211, 102, 0.12)' }]}>
                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>WhatsApp Business Bot</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.whatsapp?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.whatsapp?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.whatsapp?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Automated order receipts, PDF reports, and village broadcasts.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.whatsapp?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('whatsapp', 'WhatsApp Bot')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Provider:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'META_CLOUD', label: 'Meta Cloud API' },
                    { key: 'GUPSHUP', label: 'Gupshup' },
                    { key: 'WATI', label: 'WATI' },
                  ].map((p) => {
                    const isSelected = localConfig.whatsapp?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedGreen,
                        ]}
                        onPress={() => handleSetProvider('whatsapp', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#25D366' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Fields */}
              <View style={styles.fieldsContainer}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: subTextColor }]}>Phone Number ID</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="109823471..."
                        placeholderTextColor={subTextColor}
                        value={localConfig.whatsapp?.providers?.metaCloud?.phoneNumberId || ''}
                        onChangeText={(val) => handleUpdateField('whatsapp', 'metaCloud', 'phoneNumberId', val)}
                      />
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: subTextColor }]}>Access Token</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="EAAB..."
                        placeholderTextColor={subTextColor}
                        secureTextEntry={!showSecrets['wa_token']}
                        value={localConfig.whatsapp?.providers?.metaCloud?.accessToken || ''}
                        onChangeText={(val) => handleUpdateField('whatsapp', 'metaCloud', 'accessToken', val)}
                      />
                      <TouchableOpacity onPress={() => toggleShowSecret('wa_token')}>
                        <Ionicons
                          name={showSecrets['wa_token'] ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={subTextColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('whatsapp', 'WhatsApp Business Bot')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#16a34a', '#15803d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save WhatsApp Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 5. Satellite & Farm Radar */}
          {activeFilter === 'SATELLITE' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Ionicons name="planet" size={22} color="#10b981" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Satellite Farm Radar</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.satellite?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.satellite?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.satellite?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Sentinel-2 & ISRO NDVI crop vigor, moisture, and soil health maps.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.satellite?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('satellite', 'Satellite Radar')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Satellite Provider:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'AGROMONITORING', label: 'Agromonitoring' },
                    { key: 'SENTINEL_HUB', label: 'Sentinel Hub' },
                    { key: 'ISRO_BHUVAN', label: 'ISRO Bhuvan' },
                  ].map((p) => {
                    const isSelected = localConfig.satellite?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelected,
                        ]}
                        onPress={() => handleSetProvider('satellite', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#10b981' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldsContainer}>
                <Text style={[styles.inputLabel, { color: subTextColor }]}>Agromonitoring / Satellite API Key</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="API Key..."
                    placeholderTextColor={subTextColor}
                    secureTextEntry={!showSecrets['sat_key']}
                    value={localConfig.satellite?.providers?.agromonitoring?.apiKey || ''}
                    onChangeText={(val) => handleUpdateField('satellite', 'agromonitoring', 'apiKey', val)}
                  />
                  <TouchableOpacity onPress={() => toggleShowSecret('sat_key')}>
                    <Ionicons
                      name={showSecrets['sat_key'] ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={subTextColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('satellite', 'Satellite Farm Radar')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={isLight ? ['#16a34a', '#15803d'] : ['#00ff87', '#00b050']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color={isLight ? '#ffffff' : '#020d06'} />
                    <Text style={[styles.toolSaveBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>
                      Save Satellite Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 6. Weather Telemetry */}
          {activeFilter === 'WEATHER' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                    <Ionicons name="partly-sunny" size={22} color="#059669" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Weather & Spray Forecast</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.weather?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.weather?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.weather?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Hyperlocal rainfall, wind speed spray advisories, and weather warnings.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.weather?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('weather', 'Weather Telemetry')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Weather Source:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'OPEN_METEO', label: 'Open-Meteo (Free No-Key)' },
                    { key: 'OPEN_WEATHER_MAP', label: 'OpenWeather' },
                    { key: 'IMD', label: 'IMD Agromet' },
                  ].map((p) => {
                    const isSelected = localConfig.weather?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelected,
                        ]}
                        onPress={() => handleSetProvider('weather', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#059669' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldsContainer}>
                {localConfig.weather?.activeProvider === 'OPEN_METEO' ? (
                  <Text style={[styles.fieldHint, { color: subTextColor }]}>
                    ✅ Open-Meteo is active with zero cost and no API key required (10,000 daily free calls).
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.inputLabel, { color: subTextColor }]}>Weather API Key</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="API Key..."
                        placeholderTextColor={subTextColor}
                        value={localConfig.weather?.providers?.openWeatherMap?.apiKey || ''}
                        onChangeText={(val) => handleUpdateField('weather', 'openWeatherMap', 'apiKey', val)}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('weather', 'Weather Telemetry')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Weather Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 7. Logistics & Couriers */}
          {activeFilter === 'LOGISTICS' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                    <Ionicons name="cube" size={22} color="#d97706" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Courier & Logistics</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.logistics?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.logistics?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.logistics?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Automated courier dispatch, AWB label generation, and live tracking.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.logistics?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('logistics', 'Logistics Courier')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Courier Engine:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'SHIPROCKET', label: 'Shiprocket (Recommended)' },
                    { key: 'DELHIVERY', label: 'Delhivery' },
                    { key: 'BORZO', label: 'Borzo Hyperlocal' },
                  ].map((p) => {
                    const isSelected = localConfig.logistics?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedAmber,
                        ]}
                        onPress={() => handleSetProvider('logistics', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#d97706' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldsContainer}>
                <Text style={[styles.inputLabel, { color: subTextColor }]}>Shiprocket / Courier Auth Token</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Courier API Token..."
                    placeholderTextColor={subTextColor}
                    secureTextEntry={!showSecrets['ship_token']}
                    value={localConfig.logistics?.providers?.shiprocket?.token || ''}
                    onChangeText={(val) => handleUpdateField('logistics', 'shiprocket', 'token', val)}
                  />
                  <TouchableOpacity onPress={() => toggleShowSecret('ship_token')}>
                    <Ionicons
                      name={showSecrets['ship_token'] ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={subTextColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('logistics', 'Logistics & Couriers')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#d97706', '#b45309']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Logistics Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 8. Push Notifications */}
          {activeFilter === 'PUSH' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <Ionicons name="notifications" size={22} color="#ef4444" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Push Notifications</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.push?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.push?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.push?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Firebase Cloud Messaging for order alerts, mandi rates, and rain sirens.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.push?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('push', 'Push Notifications')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.fieldsContainer}>
                <Text style={[styles.inputLabel, { color: subTextColor }]}>FCM Server Key / Web Push VAPID Key</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Firebase Cloud Messaging Server Key..."
                    placeholderTextColor={subTextColor}
                    secureTextEntry={!showSecrets['push_key']}
                    value={localConfig.push?.providers?.firebaseFcm?.serverKey || ''}
                    onChangeText={(val) => handleUpdateField('push', 'firebaseFcm', 'serverKey', val)}
                  />
                  <TouchableOpacity onPress={() => toggleShowSecret('push_key')}>
                    <Ionicons
                      name={showSecrets['push_key'] ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={subTextColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('push', 'Push Notifications')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Push Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
    minWidth: 260,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONT.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  filterBar: {
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  dropdownRelativeBox: {
    position: 'relative',
    minWidth: 260,
    flex: 1,
    maxWidth: 380,
    zIndex: 110,
  },
  dropdownTrigger: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    minWidth: 260,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 5,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
    gap: 10,
  },
  dropdownItemActiveLight: {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  dropdownItemActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardsGrid: {
    gap: 16,
  },
  cardsGridDesktop: {
    display: 'flex',
  },
  toolCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  toolTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  toolDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  sandboxToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  sectionRow: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  optionsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionPillSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionPillSelectedBlue: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  optionPillSelectedIndigo: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionPillSelectedGreen: {
    borderColor: '#25D366',
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
  },
  optionPillSelectedAmber: {
    borderColor: '#d97706',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  optionPillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  fieldsContainer: {
    gap: 8,
    marginTop: 4,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  col: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
    paddingVertical: 0,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  toolSaveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  toolSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toolSaveBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
});
