import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSystemIntegrations,
  useUpdateSystemIntegrations,
} from '@/src/hooks/useSystemIntegrations';
import { SystemIntegrationsConfig } from '@/src/api/appSettings.api';

type TabKey = 'sms' | 'gateway' | 'whatsapp' | 'product' | 'social' | 'otp' | 'about';

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

const TABS: TabItem[] = [
  { key: 'sms', label: 'SMS Service', icon: 'chatbox-ellipses-outline' },
  { key: 'gateway', label: 'Payment Gateway', icon: 'card-outline' },
  { key: 'whatsapp', label: 'WhatsApp API', icon: 'logo-whatsapp' },
  { key: 'product', label: 'Product Settings', icon: 'cube-outline' },
  { key: 'social', label: 'Social Media', icon: 'share-social-outline' },
  { key: 'otp', label: 'OTP & Verification', icon: 'shield-checkmark-outline' },
  { key: 'about', label: 'Company & About', icon: 'business-outline' },
];

export default function CPanelScreen() {
  const { data: remoteConfig, isLoading, isError, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [activeTab, setActiveTab] = useState<TabKey>('sms');
  const [formData, setFormData] = useState<SystemIntegrationsConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Sync state when remote data loads
  useEffect(() => {
    if (remoteConfig) {
      setFormData(JSON.parse(JSON.stringify(remoteConfig)));
    }
  }, [remoteConfig]);

  const toggleSecret = (fieldKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    if (!formData) return;
    try {
      await updateMutation.mutateAsync(formData);
      showToast('✅ All settings saved and synced successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to save settings');
    }
  };

  if (isLoading || !formData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff87" />
        <Text style={styles.loadingText}>Loading Executive Command Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.crownBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#00ff87" />
            <Text style={styles.crownText}>EXECUTIVE CONTROL</Text>
          </View>
          <Text style={styles.headerTitle}>⚡ C-Panel — Service Integrations</Text>
          <Text style={styles.headerSubtitle}>
            Configure Firebase SMS, Payment Gateways, WhatsApp, Products, Social Links, OTP Channels & Branding.
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            <LinearGradient
              colors={['#00ff87', '#00b050']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#020d06" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={18} color="#020d06" />
                  <Text style={styles.saveBtnText}>Save Settings</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Toast Notification Banner ─────────────────────────── */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#00ff87" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Navigation Tabs ───────────────────────────────────── */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? '#00ff87' : '#94a3b8'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Active Tab Content Area ────────────────────────────── */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentBody}>
        {activeTab === 'sms' && (
          <SmsSettingsSection
            data={formData.sms}
            onChange={(updated) => setFormData({ ...formData, sms: updated })}
            showSecrets={showSecrets}
            toggleSecret={toggleSecret}
            onTestSuccess={(msg) => showToast(msg)}
          />
        )}

        {activeTab === 'gateway' && (
          <GatewaySettingsSection
            data={formData.gateway}
            onChange={(updated) => setFormData({ ...formData, gateway: updated })}
            showSecrets={showSecrets}
            toggleSecret={toggleSecret}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppSettingsSection
            data={formData.whatsapp}
            onChange={(updated) => setFormData({ ...formData, whatsapp: updated })}
            showSecrets={showSecrets}
            toggleSecret={toggleSecret}
          />
        )}

        {activeTab === 'product' && (
          <ProductSettingsSection
            data={formData.product}
            onChange={(updated) => setFormData({ ...formData, product: updated })}
          />
        )}

        {activeTab === 'social' && (
          <SocialSettingsSection
            data={formData.socialMedia}
            onChange={(updated) => setFormData({ ...formData, socialMedia: updated })}
          />
        )}

        {activeTab === 'otp' && (
          <OtpSettingsSection
            data={formData.otp}
            onChange={(updated) => setFormData({ ...formData, otp: updated })}
          />
        )}

        {activeTab === 'about' && (
          <AboutSettingsSection
            data={formData.about}
            onChange={(updated) => setFormData({ ...formData, about: updated })}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SMS SERVICE SETTINGS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SmsSettingsSection({
  data,
  onChange,
  showSecrets,
  toggleSecret,
  onTestSuccess,
}: {
  data: SystemIntegrationsConfig['sms'];
  onChange: (updated: SystemIntegrationsConfig['sms']) => void;
  showSecrets: Record<string, boolean>;
  toggleSecret: (key: string) => void;
  onTestSuccess: (msg: string) => void;
}) {
  const providers: Array<{ key: SystemIntegrationsConfig['sms']['activeProvider']; name: string; icon: string }> = [
    { key: 'FIREBASE', name: 'Firebase Phone Auth / SMS', icon: 'flame' },
    { key: 'FAST2SMS', name: 'Fast2SMS (India OTP/DLT)', icon: 'flash' },
    { key: 'MSG91', name: 'MSG91 Enterprise', icon: 'paper-plane' },
    { key: 'TWILIO', name: 'Twilio Global SMS', icon: 'globe' },
    { key: 'TEXTLOCAL', name: 'Textlocal India', icon: 'chatbubble' },
    { key: 'GUPSHUP', name: 'Gupshup SMS', icon: 'send' },
    { key: 'CUSTOM_HTTP', name: 'Custom HTTP Webhook', icon: 'code-working' },
  ];

  const firebaseData = data.providers?.firebase || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    serviceAccountJson: '',
  };

  const updateFirebaseField = (field: string, value: string) => {
    onChange({
      ...data,
      providers: {
        ...data.providers,
        firebase: {
          ...firebaseData,
          [field]: value,
        },
      },
    });
  };

  const updateProviderField = (provider: keyof typeof data.providers, field: string, value: string) => {
    onChange({
      ...data,
      providers: {
        ...data.providers,
        [provider]: {
          ...(data.providers[provider] || {}),
          [field]: value,
        },
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>SMS Service Provider Configuration</Text>
          <Text style={styles.cardSubtitle}>
            Select your active SMS gateway. Switch providers on the fly with seamless credential storage.
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Service Enabled</Text>
          <Switch
            value={data.isEnabled}
            onValueChange={(val) => onChange({ ...data, isEnabled: val })}
            trackColor={{ false: '#1e293b', true: '#00ff87' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Provider Selector Grid */}
      <Text style={styles.fieldSectionHeading}>ACTIVE SMS PROVIDER (SWITCH ON THE FLY):</Text>
      <View style={styles.providerGrid}>
        {providers.map((p) => {
          const isSelected = data.activeProvider === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.providerTile, isSelected && styles.providerTileSelected]}
              onPress={() => onChange({ ...data, activeProvider: p.key })}
            >
              <Ionicons
                name={p.icon as any}
                size={20}
                color={isSelected ? '#00ff87' : '#94a3b8'}
              />
              <Text style={[styles.providerTileName, isSelected && styles.providerTileNameSelected]}>
                {p.name}
              </Text>
              {isSelected && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>ACTIVE</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Config Form for Active Provider */}
      <View style={styles.formContainer}>
        {data.activeProvider === 'FIREBASE' && (
          <>
            <View style={styles.firebaseNotice}>
              <View style={styles.firebaseNoticeHeader}>
                <Ionicons name="flame" size={20} color="#ff9800" />
                <Text style={styles.firebaseNoticeTitle}>Google Firebase Phone Authentication & SMS</Text>
              </View>
              <Text style={styles.firebaseNoticeText}>
                FarmsKing utilizes Firebase for instant, tamper-proof Phone OTP SMS verification with high delivery rates across India and global telecom networks. Configure Web credentials and Admin SDK Service Account JSON below.
              </Text>
            </View>

            <InputField
              label="Firebase Web API Key"
              value={firebaseData.apiKey}
              onChangeText={(val) => updateFirebaseField('apiKey', val)}
              placeholder="AIzaSyC4ZPSAJcbb7xHzPdWlmqNo0yX2rnLeIgo"
              isSecret={!showSecrets['firebase_key']}
              onToggleSecret={() => toggleSecret('firebase_key')}
            />
            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <InputField
                  label="Firebase Project ID"
                  value={firebaseData.projectId}
                  onChangeText={(val) => updateFirebaseField('projectId', val)}
                  placeholder="farmsking-510606"
                />
              </View>
              <View style={styles.colHalf}>
                <InputField
                  label="Auth Domain"
                  value={firebaseData.authDomain}
                  onChangeText={(val) => updateFirebaseField('authDomain', val)}
                  placeholder="farmsking-510606.firebaseapp.com"
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <InputField
                  label="App ID"
                  value={firebaseData.appId}
                  onChangeText={(val) => updateFirebaseField('appId', val)}
                  placeholder="1:742233980320:web:baebebe2a59b7a4857b8c5"
                />
              </View>
              <View style={styles.colHalf}>
                <InputField
                  label="Messaging Sender ID"
                  value={firebaseData.messagingSenderId}
                  onChangeText={(val) => updateFirebaseField('messagingSenderId', val)}
                  placeholder="742233980320"
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <InputField
                  label="Storage Bucket (Optional)"
                  value={firebaseData.storageBucket}
                  onChangeText={(val) => updateFirebaseField('storageBucket', val)}
                  placeholder="farmsking-510606.firebasestorage.app"
                />
              </View>
              <View style={styles.colHalf}>
                <InputField
                  label="Measurement ID (Optional)"
                  value={firebaseData.measurementId}
                  onChangeText={(val) => updateFirebaseField('measurementId', val)}
                  placeholder="G-42NJGE0F0D"
                />
              </View>
            </View>

            <InputField
              label="Firebase Service Account JSON (Private Key for Server SDK)"
              value={firebaseData.serviceAccountJson}
              onChangeText={(val) => updateFirebaseField('serviceAccountJson', val)}
              placeholder='Paste {"type":"service_account", "project_id":"farmsking-510606", ...} JSON'
              multiline
              isSecret={!showSecrets['firebase_sa']}
              onToggleSecret={() => toggleSecret('firebase_sa')}
            />
          </>
        )}

        {data.activeProvider === 'FAST2SMS' && (
          <>
            <InputField
              label="Fast2SMS API Key"
              value={data.providers.fast2sms.apiKey}
              onChangeText={(val) => updateProviderField('fast2sms', 'apiKey', val)}
              placeholder="Paste Fast2SMS API Key"
              isSecret={!showSecrets['fast2sms_key']}
              onToggleSecret={() => toggleSecret('fast2sms_key')}
            />
            <InputField
              label="Sender ID (6-Character DLT Header)"
              value={data.providers.fast2sms.senderId}
              onChangeText={(val) => updateProviderField('fast2sms', 'senderId', val)}
              placeholder="e.g. FRMKNG"
            />
            <InputField
              label="DLT Entity ID"
              value={data.providers.fast2sms.entityId}
              onChangeText={(val) => updateProviderField('fast2sms', 'entityId', val)}
              placeholder="e.g. 1201160000000000"
            />
          </>
        )}

        {data.activeProvider === 'MSG91' && (
          <>
            <InputField
              label="MSG91 Auth Key"
              value={data.providers.msg91.authKey}
              onChangeText={(val) => updateProviderField('msg91', 'authKey', val)}
              placeholder="Paste MSG91 Auth Key"
              isSecret={!showSecrets['msg91_key']}
              onToggleSecret={() => toggleSecret('msg91_key')}
            />
            <InputField
              label="Sender ID"
              value={data.providers.msg91.senderId}
              onChangeText={(val) => updateProviderField('msg91', 'senderId', val)}
              placeholder="e.g. FRMKNG"
            />
            <InputField
              label="DLT Flow / Template ID"
              value={data.providers.msg91.dltFlowId}
              onChangeText={(val) => updateProviderField('msg91', 'dltFlowId', val)}
              placeholder="e.g. 64a8b1c2..."
            />
          </>
        )}

        {data.activeProvider === 'TWILIO' && (
          <>
            <InputField
              label="Twilio Account SID"
              value={data.providers.twilio.accountSid}
              onChangeText={(val) => updateProviderField('twilio', 'accountSid', val)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <InputField
              label="Twilio Auth Token"
              value={data.providers.twilio.authToken}
              onChangeText={(val) => updateProviderField('twilio', 'authToken', val)}
              placeholder="Paste Twilio Auth Token"
              isSecret={!showSecrets['twilio_token']}
              onToggleSecret={() => toggleSecret('twilio_token')}
            />
            <InputField
              label="Twilio Sender Phone Number"
              value={data.providers.twilio.fromNumber}
              onChangeText={(val) => updateProviderField('twilio', 'fromNumber', val)}
              placeholder="e.g. +14155552671"
            />
          </>
        )}

        {data.activeProvider === 'TEXTLOCAL' && (
          <>
            <InputField
              label="Textlocal API Key"
              value={data.providers.textlocal.apiKey}
              onChangeText={(val) => updateProviderField('textlocal', 'apiKey', val)}
              placeholder="Paste Textlocal API Key"
              isSecret={!showSecrets['textlocal_key']}
              onToggleSecret={() => toggleSecret('textlocal_key')}
            />
            <InputField
              label="Sender Name"
              value={data.providers.textlocal.senderName}
              onChangeText={(val) => updateProviderField('textlocal', 'senderName', val)}
              placeholder="e.g. FRMKNG"
            />
          </>
        )}

        {data.activeProvider === 'GUPSHUP' && (
          <>
            <InputField
              label="Gupshup User ID"
              value={data.providers.gupshup.userId}
              onChangeText={(val) => updateProviderField('gupshup', 'userId', val)}
              placeholder="Enter User ID"
            />
            <InputField
              label="Gupshup Password"
              value={data.providers.gupshup.password}
              onChangeText={(val) => updateProviderField('gupshup', 'password', val)}
              placeholder="Enter Password"
              isSecret={!showSecrets['gupshup_pw']}
              onToggleSecret={() => toggleSecret('gupshup_pw')}
            />
            <InputField
              label="Sender Mask"
              value={data.providers.gupshup.senderMask}
              onChangeText={(val) => updateProviderField('gupshup', 'senderMask', val)}
              placeholder="e.g. FRMKNG"
            />
          </>
        )}

        {data.activeProvider === 'CUSTOM_HTTP' && (
          <>
            <InputField
              label="Endpoint URL"
              value={data.providers.customHttp.endpointUrl}
              onChangeText={(val) => updateProviderField('customHttp', 'endpointUrl', val)}
              placeholder="https://sms-gateway.example.com/api/send"
            />
            <InputField
              label="Auth Header Key"
              value={data.providers.customHttp.authHeaderKey}
              onChangeText={(val) => updateProviderField('customHttp', 'authHeaderKey', val)}
              placeholder="e.g. Authorization or X-Api-Key"
            />
            <InputField
              label="Auth Header Value"
              value={data.providers.customHttp.authHeaderValue}
              onChangeText={(val) => updateProviderField('customHttp', 'authHeaderValue', val)}
              placeholder="Bearer secret_token_here"
              isSecret={!showSecrets['custom_auth']}
              onToggleSecret={() => toggleSecret('custom_auth')}
            />
            <InputField
              label="JSON Payload Template (Placeholders: {{mobile}}, {{message}})"
              value={data.providers.customHttp.payloadTemplate}
              onChangeText={(val) => updateProviderField('customHttp', 'payloadTemplate', val)}
              placeholder='{"to":"{{mobile}}","text":"{{message}}"}'
            />
          </>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAYMENT GATEWAY SETTINGS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function GatewaySettingsSection({
  data,
  onChange,
  showSecrets,
  toggleSecret,
}: {
  data: SystemIntegrationsConfig['gateway'];
  onChange: (updated: SystemIntegrationsConfig['gateway']) => void;
  showSecrets: Record<string, boolean>;
  toggleSecret: (key: string) => void;
}) {
  const gateways: Array<{ key: SystemIntegrationsConfig['gateway']['activeGateway']; name: string; icon: string }> = [
    { key: 'PHONEPE', name: 'PhonePe Standard Checkout', icon: 'flash' },
    { key: 'CASHFREE', name: 'Cashfree Split Marketplace', icon: 'wallet' },
    { key: 'RAZORPAY', name: 'Razorpay Payment Gateway', icon: 'card' },
    { key: 'PAYU', name: 'PayU Money / Enterprise', icon: 'cash' },
    { key: 'STRIPE', name: 'Stripe Global Payments', icon: 'globe' },
    { key: 'UPI_DIRECT', name: 'Direct UPI VPA / QR', icon: 'qr-code' },
  ];

  const updateGatewayField = (gateway: keyof typeof data.providers, field: string, value: string) => {
    onChange({
      ...data,
      providers: {
        ...data.providers,
        [gateway]: {
          ...data.providers[gateway],
          [field]: value,
        },
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Payment Gateway & Checkout Provider</Text>
          <Text style={styles.cardSubtitle}>
            Select which payment engine powers user purchases, plan subscriptions, and farmer payments.
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Sandbox / Test Mode</Text>
          <Switch
            value={data.isSandbox}
            onValueChange={(val) => onChange({ ...data, isSandbox: val })}
            trackColor={{ false: '#1e293b', true: '#f59e0b' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <Text style={styles.fieldSectionHeading}>ACTIVE PAYMENT GATEWAY (SWITCH ON THE FLY):</Text>
      <View style={styles.providerGrid}>
        {gateways.map((g) => {
          const isSelected = data.activeGateway === g.key;
          return (
            <TouchableOpacity
              key={g.key}
              style={[styles.providerTile, isSelected && styles.providerTileSelected]}
              onPress={() => onChange({ ...data, activeGateway: g.key })}
            >
              <Ionicons
                name={g.icon as any}
                size={20}
                color={isSelected ? '#00ff87' : '#94a3b8'}
              />
              <Text style={[styles.providerTileName, isSelected && styles.providerTileNameSelected]}>
                {g.name}
              </Text>
              {isSelected && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>ACTIVE</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Gateway Fields */}
      <View style={styles.formContainer}>
        {data.activeGateway === 'PHONEPE' && (
          <>
            <InputField
              label="Merchant ID"
              value={data.providers.phonepe.merchantId}
              onChangeText={(val) => updateGatewayField('phonepe', 'merchantId', val)}
              placeholder="e.g. M22KMYD10AWD8_..."
            />
            <InputField
              label="Client ID"
              value={data.providers.phonepe.clientId}
              onChangeText={(val) => updateGatewayField('phonepe', 'clientId', val)}
              placeholder="Enter PhonePe Client ID"
            />
            <InputField
              label="Client Secret"
              value={data.providers.phonepe.clientSecret}
              onChangeText={(val) => updateGatewayField('phonepe', 'clientSecret', val)}
              placeholder="Paste Client Secret"
              isSecret={!showSecrets['phonepe_secret']}
              onToggleSecret={() => toggleSecret('phonepe_secret')}
            />
            <InputField
              label="Salt Key"
              value={data.providers.phonepe.saltKey}
              onChangeText={(val) => updateGatewayField('phonepe', 'saltKey', val)}
              placeholder="Paste Salt Key"
              isSecret={!showSecrets['phonepe_salt']}
              onToggleSecret={() => toggleSecret('phonepe_salt')}
            />
            <InputField
              label="Salt Index"
              value={data.providers.phonepe.saltIndex}
              onChangeText={(val) => updateGatewayField('phonepe', 'saltIndex', val)}
              placeholder="1"
            />
            <InputField
              label="Webhook Username"
              value={data.providers.phonepe.webhookUsername}
              onChangeText={(val) => updateGatewayField('phonepe', 'webhookUsername', val)}
              placeholder="farmsking_webhook"
            />
            <InputField
              label="Webhook Password"
              value={data.providers.phonepe.webhookPassword}
              onChangeText={(val) => updateGatewayField('phonepe', 'webhookPassword', val)}
              placeholder="Webhook password"
              isSecret={!showSecrets['phonepe_wh_pw']}
              onToggleSecret={() => toggleSecret('phonepe_wh_pw')}
            />
          </>
        )}

        {data.activeGateway === 'CASHFREE' && (
          <>
            <InputField
              label="Cashfree App ID"
              value={data.providers.cashfree.appId}
              onChangeText={(val) => updateGatewayField('cashfree', 'appId', val)}
              placeholder="TEST11182203ad31..."
            />
            <InputField
              label="Cashfree Secret Key"
              value={data.providers.cashfree.secretKey}
              onChangeText={(val) => updateGatewayField('cashfree', 'secretKey', val)}
              placeholder="cfsk_ma_..."
              isSecret={!showSecrets['cashfree_secret']}
              onToggleSecret={() => toggleSecret('cashfree_secret')}
            />
            <InputField
              label="Webhook Verification Secret"
              value={data.providers.cashfree.webhookSecret}
              onChangeText={(val) => updateGatewayField('cashfree', 'webhookSecret', val)}
              placeholder="Paste Webhook Secret"
            />
          </>
        )}

        {data.activeGateway === 'RAZORPAY' && (
          <>
            <InputField
              label="Razorpay Key ID"
              value={data.providers.razorpay.keyId}
              onChangeText={(val) => updateGatewayField('razorpay', 'keyId', val)}
              placeholder="rzp_test_..."
            />
            <InputField
              label="Razorpay Key Secret"
              value={data.providers.razorpay.keySecret}
              onChangeText={(val) => updateGatewayField('razorpay', 'keySecret', val)}
              placeholder="Paste Key Secret"
              isSecret={!showSecrets['razorpay_secret']}
              onToggleSecret={() => toggleSecret('razorpay_secret')}
            />
            <InputField
              label="Webhook Secret"
              value={data.providers.razorpay.webhookSecret}
              onChangeText={(val) => updateGatewayField('razorpay', 'webhookSecret', val)}
              placeholder="Paste Webhook Secret"
            />
          </>
        )}

        {data.activeGateway === 'PAYU' && (
          <>
            <InputField
              label="PayU Merchant Key"
              value={data.providers.payu.merchantKey}
              onChangeText={(val) => updateGatewayField('payu', 'merchantKey', val)}
              placeholder="Merchant Key"
            />
            <InputField
              label="PayU Merchant Salt"
              value={data.providers.payu.merchantSalt}
              onChangeText={(val) => updateGatewayField('payu', 'merchantSalt', val)}
              placeholder="Merchant Salt"
              isSecret={!showSecrets['payu_salt']}
              onToggleSecret={() => toggleSecret('payu_salt')}
            />
          </>
        )}

        {data.activeGateway === 'STRIPE' && (
          <>
            <InputField
              label="Stripe Publishable Key"
              value={data.providers.stripe.publishableKey}
              onChangeText={(val) => updateGatewayField('stripe', 'publishableKey', val)}
              placeholder="pk_test_..."
            />
            <InputField
              label="Stripe Secret Key"
              value={data.providers.stripe.secretKey}
              onChangeText={(val) => updateGatewayField('stripe', 'secretKey', val)}
              placeholder="sk_test_..."
              isSecret={!showSecrets['stripe_secret']}
              onToggleSecret={() => toggleSecret('stripe_secret')}
            />
            <InputField
              label="Stripe Webhook Signing Secret"
              value={data.providers.stripe.webhookSecret}
              onChangeText={(val) => updateGatewayField('stripe', 'webhookSecret', val)}
              placeholder="whsec_..."
            />
          </>
        )}

        {data.activeGateway === 'UPI_DIRECT' && (
          <>
            <InputField
              label="Primary UPI ID (VPA)"
              value={data.providers.upiDirect.upiId}
              onChangeText={(val) => updateGatewayField('upiDirect', 'upiId', val)}
              placeholder="e.g. surindersinghmakhu-8@okicici"
            />
            <InputField
              label="Payee Account / Legal Name"
              value={data.providers.upiDirect.payeeName}
              onChangeText={(val) => updateGatewayField('upiDirect', 'payeeName', val)}
              placeholder="e.g. FarmsKing India Pvt Ltd"
            />
            <InputField
              label="Merchant Category Code (MCC)"
              value={data.providers.upiDirect.merchantCode}
              onChangeText={(val) => updateGatewayField('upiDirect', 'merchantCode', val)}
              placeholder="0000"
            />
          </>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. WHATSAPP ENGINE SETTINGS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function WhatsAppSettingsSection({
  data,
  onChange,
  showSecrets,
  toggleSecret,
}: {
  data: SystemIntegrationsConfig['whatsapp'];
  onChange: (updated: SystemIntegrationsConfig['whatsapp']) => void;
  showSecrets: Record<string, boolean>;
  toggleSecret: (key: string) => void;
}) {
  const waProviders: Array<{ key: SystemIntegrationsConfig['whatsapp']['activeProvider']; name: string; icon: string }> = [
    { key: 'META_CLOUD', name: 'Meta WhatsApp Cloud API (Official)', icon: 'logo-whatsapp' },
    { key: 'BAILEYS_QR', name: 'Baileys Multi-Device QR (Self-Hosted)', icon: 'qr-code' },
    { key: 'GUPSHUP', name: 'Gupshup WhatsApp Enterprise', icon: 'chatbubbles' },
    { key: 'WATI', name: 'Wati Official API', icon: 'send' },
    { key: 'INTERAKT', name: 'Interakt / Jio Haptik', icon: 'flash' },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>WhatsApp Engine & Automation</Text>
          <Text style={styles.cardSubtitle}>
            Configure automated WhatsApp OTPs, notifications, crop alerts, and farmer group automation.
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>WhatsApp Active</Text>
          <Switch
            value={data.isEnabled}
            onValueChange={(val) => onChange({ ...data, isEnabled: val })}
            trackColor={{ false: '#1e293b', true: '#00ff87' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <Text style={styles.fieldSectionHeading}>ACTIVE WHATSAPP ENGINE (SWITCH ON THE FLY):</Text>
      <View style={styles.providerGrid}>
        {waProviders.map((w) => {
          const isSelected = data.activeProvider === w.key;
          return (
            <TouchableOpacity
              key={w.key}
              style={[styles.providerTile, isSelected && styles.providerTileSelected]}
              onPress={() => onChange({ ...data, activeProvider: w.key })}
            >
              <Ionicons
                name={w.icon as any}
                size={20}
                color={isSelected ? '#00ff87' : '#94a3b8'}
              />
              <Text style={[styles.providerTileName, isSelected && styles.providerTileNameSelected]}>
                {w.name}
              </Text>
              {isSelected && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>ACTIVE</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.formContainer}>
        {data.activeProvider === 'META_CLOUD' && (
          <>
            <InputField
              label="Meta Phone Number ID"
              value={data.providers.metaCloud.phoneNumberId}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    metaCloud: { ...data.providers.metaCloud, phoneNumberId: val },
                  },
                })
              }
              placeholder="e.g. 9577622000"
            />
            <InputField
              label="WhatsApp Business Account ID (WABA ID)"
              value={data.providers.metaCloud.wabaId}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    metaCloud: { ...data.providers.metaCloud, wabaId: val },
                  },
                })
              }
              placeholder="e.g. 1098234712039"
            />
            <InputField
              label="Permanent System User Access Token"
              value={data.providers.metaCloud.accessToken}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    metaCloud: { ...data.providers.metaCloud, accessToken: val },
                  },
                })
              }
              placeholder="EAAGxxxxxxxxxxxxxxxxxxxx..."
              isSecret={!showSecrets['meta_wa_token']}
              onToggleSecret={() => toggleSecret('meta_wa_token')}
            />
            <InputField
              label="Webhook Verify Token"
              value={data.providers.metaCloud.verifyToken}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    metaCloud: { ...data.providers.metaCloud, verifyToken: val },
                  },
                })
              }
              placeholder="farmsking_verify_token_2026"
            />
            <InputField
              label="Approved Message Template Namespace"
              value={data.providers.metaCloud.templateNamespace}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    metaCloud: { ...data.providers.metaCloud, templateNamespace: val },
                  },
                })
              }
              placeholder="farmsking_templates"
            />
          </>
        )}

        {data.activeProvider === 'BAILEYS_QR' && (
          <>
            <InputField
              label="Community Advisor WhatsApp Group JID"
              value={data.providers.baileys.groupJid}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    baileys: { ...data.providers.baileys, groupJid: val },
                  },
                })
              }
              placeholder="120363xxxxxx@g.us"
            />
            <View style={styles.toggleRowInline}>
              <Text style={styles.label}>Auto-Reconnect on Disconnect</Text>
              <Switch
                value={data.providers.baileys.autoReconnect}
                onValueChange={(val) =>
                  onChange({
                    ...data,
                    providers: {
                      ...data.providers,
                      baileys: { ...data.providers.baileys, autoReconnect: val },
                    },
                  })
                }
                trackColor={{ false: '#1e293b', true: '#00ff87' }}
                thumbColor="#ffffff"
              />
            </View>
          </>
        )}

        {data.activeProvider === 'GUPSHUP' && (
          <>
            <InputField
              label="Gupshup App Name"
              value={data.providers.gupshup.appName}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    gupshup: { ...data.providers.gupshup, appName: val },
                  },
                })
              }
              placeholder="FarmsKingWA"
            />
            <InputField
              label="Gupshup App Token"
              value={data.providers.gupshup.appToken}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    gupshup: { ...data.providers.gupshup, appToken: val },
                  },
                })
              }
              placeholder="Paste Gupshup App Token"
              isSecret={!showSecrets['gupshup_token']}
              onToggleSecret={() => toggleSecret('gupshup_token')}
            />
            <InputField
              label="Source WhatsApp Number"
              value={data.providers.gupshup.sourceNumber}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    gupshup: { ...data.providers.gupshup, sourceNumber: val },
                  },
                })
              }
              placeholder="+919888812345"
            />
          </>
        )}

        {data.activeProvider === 'WATI' && (
          <>
            <InputField
              label="Wati API Endpoint URL"
              value={data.providers.wati.endpointUrl}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    wati: { ...data.providers.wati, endpointUrl: val },
                  },
                })
              }
              placeholder="https://live-server-xxxx.wati.io"
            />
            <InputField
              label="Wati Access Token"
              value={data.providers.wati.accessToken}
              onChangeText={(val) =>
                onChange({
                  ...data,
                  providers: {
                    ...data.providers,
                    wati: { ...data.providers.wati, accessToken: val },
                  },
                })
              }
              placeholder="Bearer Token"
              isSecret={!showSecrets['wati_token']}
              onToggleSecret={() => toggleSecret('wati_token')}
            />
          </>
        )}

        {data.activeProvider === 'INTERAKT' && (
          <InputField
            label="Interakt Secret API Key"
            value={data.providers.interakt.apiKey}
            onChangeText={(val) =>
              onChange({
                ...data,
                providers: {
                  ...data.providers,
                  interakt: { ...data.providers.interakt, apiKey: val },
                },
              })
            }
            placeholder="Paste Interakt API Key"
            isSecret={!showSecrets['interakt_key']}
            onToggleSecret={() => toggleSecret('interakt_key')}
          />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PRODUCT & COMMERCE SETTINGS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ProductSettingsSection({
  data,
  onChange,
}: {
  data: SystemIntegrationsConfig['product'];
  onChange: (updated: SystemIntegrationsConfig['product']) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Product, Marketplace & Store Rules</Text>
          <Text style={styles.cardSubtitle}>
            Configure vendor commission rates, default GST, delivery thresholds, and return windows.
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Platform Fee / Commission (%)"
              value={String(data.platformFeePercent ?? 5)}
              onChangeText={(val) => onChange({ ...data, platformFeePercent: parseFloat(val) || 0 })}
              placeholder="5.0"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Default GST Tax Rate (%)"
              value={String(data.defaultGstPercent ?? 5)}
              onChangeText={(val) => onChange({ ...data, defaultGstPercent: parseFloat(val) || 0 })}
              placeholder="5.0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Free Delivery Order Minimum (₹)"
              value={String(data.freeDeliveryThreshold ?? 499)}
              onChangeText={(val) => onChange({ ...data, freeDeliveryThreshold: parseFloat(val) || 0 })}
              placeholder="499"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Standard Shipping Fee (₹)"
              value={String(data.baseShippingCharge ?? 40)}
              onChangeText={(val) => onChange({ ...data, baseShippingCharge: parseFloat(val) || 0 })}
              placeholder="40"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Low Stock Warning Alert (Units)"
              value={String(data.lowStockThreshold ?? 5)}
              onChangeText={(val) => onChange({ ...data, lowStockThreshold: parseInt(val, 10) || 0 })}
              placeholder="5"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Return / Replacement Window (Days)"
              value={String(data.returnReplacementDays ?? 7)}
              onChangeText={(val) => onChange({ ...data, returnReplacementDays: parseInt(val, 10) || 0 })}
              placeholder="7"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.toggleRowInline}>
            <View>
              <Text style={styles.label}>Allow Cash on Delivery (COD)</Text>
              <Text style={styles.subtext}>Enable buyers to pay cash on doorstep delivery</Text>
            </View>
            <Switch
              value={data.enableCod}
              onValueChange={(val) => onChange({ ...data, enableCod: val })}
              trackColor={{ false: '#1e293b', true: '#00ff87' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRowInline}>
            <View>
              <Text style={styles.label}>Direct Platform Sales</Text>
              <Text style={styles.subtext}>Sell company inventory alongside farmer listings</Text>
            </View>
            <Switch
              value={data.allowDirectSales}
              onValueChange={(val) => onChange({ ...data, allowDirectSales: val })}
              trackColor={{ false: '#1e293b', true: '#00ff87' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRowInline}>
            <View>
              <Text style={styles.label}>Auto-Approve Customer Reviews</Text>
              <Text style={styles.subtext}>Publish verified customer ratings immediately</Text>
            </View>
            <Switch
              value={data.autoApproveReviews}
              onValueChange={(val) => onChange({ ...data, autoApproveReviews: val })}
              trackColor={{ false: '#1e293b', true: '#00ff87' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRowInline}>
            <View>
              <Text style={styles.label}>Mandatory Seller KYC</Text>
              <Text style={styles.subtext}>Require GST/PAN & Bank verification before vendor payout</Text>
            </View>
            <Switch
              value={data.requireKycForSellers}
              onValueChange={(val) => onChange({ ...data, requireKycForSellers: val })}
              trackColor={{ false: '#1e293b', true: '#00ff87' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SOCIAL MEDIA SETTINGS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SocialSettingsSection({
  data,
  onChange,
}: {
  data: SystemIntegrationsConfig['socialMedia'];
  onChange: (updated: SystemIntegrationsConfig['socialMedia']) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Social Media & Public Channels</Text>
          <Text style={styles.cardSubtitle}>
            Configure all public community links and Single Sign-On (Google Client ID).
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <InputField
          label="YouTube Official Channel URL"
          value={data.youtubeUrl}
          onChangeText={(val) => onChange({ ...data, youtubeUrl: val })}
          placeholder="https://youtube.com/@farmsking"
        />
        <InputField
          label="Instagram Profile URL"
          value={data.instagramUrl}
          onChangeText={(val) => onChange({ ...data, instagramUrl: val })}
          placeholder="https://instagram.com/farmsking.india"
        />
        <InputField
          label="Facebook Page URL"
          value={data.facebookUrl}
          onChangeText={(val) => onChange({ ...data, facebookUrl: val })}
          placeholder="https://facebook.com/farmsking.india"
        />
        <InputField
          label="Twitter / X Profile URL"
          value={data.twitterUrl}
          onChangeText={(val) => onChange({ ...data, twitterUrl: val })}
          placeholder="https://twitter.com/farmsking"
        />
        <InputField
          label="LinkedIn Company URL"
          value={data.linkedinUrl}
          onChangeText={(val) => onChange({ ...data, linkedinUrl: val })}
          placeholder="https://linkedin.com/company/farmsking"
        />
        <InputField
          label="Telegram Community Channel"
          value={data.telegramUrl}
          onChangeText={(val) => onChange({ ...data, telegramUrl: val })}
          placeholder="https://t.me/farmsking"
        />
        <InputField
          label="WhatsApp Channel Link"
          value={data.whatsappChannelUrl}
          onChangeText={(val) => onChange({ ...data, whatsappChannelUrl: val })}
          placeholder="https://whatsapp.com/channel/..."
        />
        <InputField
          label="Google OAuth Web Client ID (For Google Login)"
          value={data.googleClientId}
          onChangeText={(val) => onChange({ ...data, googleClientId: val })}
          placeholder="xxxxxx.apps.googleusercontent.com"
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. OTP & VERIFICATION POLICY SETTINGS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function OtpSettingsSection({
  data,
  onChange,
}: {
  data: SystemIntegrationsConfig['otp'];
  onChange: (updated: SystemIntegrationsConfig['otp']) => void;
}) {
  const modes: Array<{ key: SystemIntegrationsConfig['otp']['deliveryMode']; label: string; desc: string; icon: string }> = [
    { key: 'ANY_SINGLE', label: 'Farmer Choice (Any 1)', desc: 'User picks their preferred channel (Email, SMS, or WhatsApp)', icon: 'options' },
    { key: 'EMAIL_ONLY', label: 'Email OTP Only', desc: 'Secure verification strictly through verified email', icon: 'mail' },
    { key: 'SMS_ONLY', label: 'SMS OTP Only', desc: 'Fast mobile SMS dispatch via DLT / carrier network', icon: 'phone-portrait' },
    { key: 'WHATSAPP_ONLY', label: 'WhatsApp Only', desc: 'Instant OTP dispatch via official WhatsApp message', icon: 'logo-whatsapp' },
    { key: 'ANY_TWO', label: 'Any Two Channels', desc: 'Dispatches OTP simultaneously across any 2 active channels', icon: 'git-merge' },
    { key: 'ALL_CHANNELS', label: 'All Channels (Simultaneous)', desc: 'Ultra-reliable: Sends OTP simultaneously across Email, SMS & WhatsApp', icon: 'flash' },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>OTP Delivery Policy & Security Standards</Text>
          <Text style={styles.cardSubtitle}>
            Configure OTP verification delivery channels, length, expiry window, and brute-force protection.
          </Text>
        </View>
      </View>

      <Text style={styles.fieldSectionHeading}>SELECT OTP DELIVERY POLICY (DELIVERY MODE):</Text>
      <View style={styles.otpGrid}>
        {modes.map((m) => {
          const isSelected = data.deliveryMode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.otpTile, isSelected && styles.otpTileSelected]}
              onPress={() => onChange({ ...data, deliveryMode: m.key })}
            >
              <View style={styles.otpTileHeader}>
                <Ionicons
                  name={m.icon as any}
                  size={20}
                  color={isSelected ? '#00ff87' : '#94a3b8'}
                />
                <Text style={[styles.otpTileLabel, isSelected && styles.otpTileLabelSelected]}>
                  {m.label}
                </Text>
              </View>
              <Text style={styles.otpTileDesc}>{m.desc}</Text>
              {isSelected && (
                <View style={styles.activePillSmall}>
                  <Text style={styles.activePillTextSmall}>SELECTED</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Channel Toggles */}
      <Text style={[styles.fieldSectionHeading, { marginTop: 24 }]}>ENABLED CHANNELS CHECKLIST:</Text>
      <View style={styles.channelsRow}>
        <TouchableOpacity
          style={[styles.channelChip, data.channelsEnabled.email && styles.channelChipActive]}
          onPress={() =>
            onChange({
              ...data,
              channelsEnabled: { ...data.channelsEnabled, email: !data.channelsEnabled.email },
            })
          }
        >
          <Ionicons
            name="mail"
            size={16}
            color={data.channelsEnabled.email ? '#00ff87' : '#64748b'}
          />
          <Text style={[styles.channelChipText, data.channelsEnabled.email && styles.channelChipTextActive]}>
            Email OTP ({data.channelsEnabled.email ? 'Enabled' : 'Disabled'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.channelChip, data.channelsEnabled.sms && styles.channelChipActive]}
          onPress={() =>
            onChange({
              ...data,
              channelsEnabled: { ...data.channelsEnabled, sms: !data.channelsEnabled.sms },
            })
          }
        >
          <Ionicons
            name="phone-portrait"
            size={16}
            color={data.channelsEnabled.sms ? '#00ff87' : '#64748b'}
          />
          <Text style={[styles.channelChipText, data.channelsEnabled.sms && styles.channelChipTextActive]}>
            SMS OTP ({data.channelsEnabled.sms ? 'Enabled' : 'Disabled'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.channelChip, data.channelsEnabled.whatsapp && styles.channelChipActive]}
          onPress={() =>
            onChange({
              ...data,
              channelsEnabled: { ...data.channelsEnabled, whatsapp: !data.channelsEnabled.whatsapp },
            })
          }
        >
          <Ionicons
            name="logo-whatsapp"
            size={16}
            color={data.channelsEnabled.whatsapp ? '#00ff87' : '#64748b'}
          />
          <Text style={[styles.channelChipText, data.channelsEnabled.whatsapp && styles.channelChipTextActive]}>
            WhatsApp OTP ({data.channelsEnabled.whatsapp ? 'Enabled' : 'Disabled'})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <Text style={styles.label}>OTP Code Length</Text>
            <View style={styles.pillGroup}>
              <TouchableOpacity
                style={[styles.pillBtn, data.codeLength === 4 && styles.pillBtnActive]}
                onPress={() => onChange({ ...data, codeLength: 4 })}
              >
                <Text style={[styles.pillText, data.codeLength === 4 && styles.pillTextActive]}>
                  4 Digits
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillBtn, data.codeLength === 6 && styles.pillBtnActive]}
                onPress={() => onChange({ ...data, codeLength: 6 })}
              >
                <Text style={[styles.pillText, data.codeLength === 6 && styles.pillTextActive]}>
                  6 Digits (Standard)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.colHalf}>
            <InputField
              label="OTP Expiry Time (Seconds)"
              value={String(data.expirySeconds ?? 300)}
              onChangeText={(val) => onChange({ ...data, expirySeconds: parseInt(val, 10) || 60 })}
              placeholder="300"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Max Resend Attempts (Per Hour)"
              value={String(data.maxResendAttempts ?? 5)}
              onChangeText={(val) => onChange({ ...data, maxResendAttempts: parseInt(val, 10) || 3 })}
              placeholder="5"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.colHalf}>
            <View style={[styles.toggleRowInline, { marginTop: 22 }]}>
              <View>
                <Text style={styles.label}>Rate Limiting</Text>
                <Text style={styles.subtext}>Prevent SMS spam & abuse</Text>
              </View>
              <Switch
                value={data.enableRateLimiting}
                onValueChange={(val) => onChange({ ...data, enableRateLimiting: val })}
                trackColor={{ false: '#1e293b', true: '#00ff87' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMPANY & ABOUT BRANDING SECTION
// ─────────────────────────────────────────────────────────────────────────────
function AboutSettingsSection({
  data,
  onChange,
}: {
  data: SystemIntegrationsConfig['about'];
  onChange: (updated: SystemIntegrationsConfig['about']) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Company Identity, Branding & Legal Compliance</Text>
          <Text style={styles.cardSubtitle}>
            Company name, logo, tagline, registered address, GSTIN, CIN, and customer support details.
          </Text>
        </View>
      </View>

      {/* Brand Preview Card */}
      <View style={styles.brandPreviewCard}>
        <View style={styles.logoPreviewWrapper}>
          {data.logoUrl ? (
            <Image source={{ uri: data.logoUrl }} style={styles.logoPreviewImage} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#64748b" />
            </View>
          )}
        </View>
        <View style={styles.brandInfoPreview}>
          <Text style={styles.brandTitlePreview}>{data.companyName || 'Company Legal Name'}</Text>
          <Text style={styles.brandTaglinePreview}>{data.tagline || 'Company Tagline / Slogan'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.legalBadge}>
              <Text style={styles.legalBadgeText}>GSTIN: {data.gstin || 'Not Configured'}</Text>
            </View>
            <View style={styles.legalBadge}>
              <Text style={styles.legalBadgeText}>CIN: {data.cin || 'Not Configured'}</Text>
            </View>
            <View style={styles.legalBadge}>
              <Text style={styles.legalBadgeText}>v{data.appVersion || '2.0.6'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Company Legal Name"
              value={data.companyName}
              onChangeText={(val) => onChange({ ...data, companyName: val })}
              placeholder="e.g. FarmsKing India Pvt Ltd"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Brand / Marketplace Name"
              value={data.brandName}
              onChangeText={(val) => onChange({ ...data, brandName: val })}
              placeholder="e.g. FarmsKing"
            />
          </View>
        </View>

        <InputField
          label="Tagline / Motto"
          value={data.tagline}
          onChangeText={(val) => onChange({ ...data, tagline: val })}
          placeholder="e.g. Direct Farmer Marketplace for All India | Headquartered in Makhu, Punjab"
        />

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Company Logo Image URL"
              value={data.logoUrl}
              onChangeText={(val) => onChange({ ...data, logoUrl: val })}
              placeholder="https://farmsking.in/assets/logo.png"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Favicon / Icon URL"
              value={data.faviconUrl}
              onChangeText={(val) => onChange({ ...data, faviconUrl: val })}
              placeholder="https://farmsking.in/favicon.ico"
            />
          </View>
        </View>

        <InputField
          label="Registered Office Address"
          value={data.registeredAddress}
          onChangeText={(val) => onChange({ ...data, registeredAddress: val })}
          placeholder="Near Bus Stand, Makhu, Tehsil Zira, District Ferozepur, Punjab 142044"
        />

        <InputField
          label="Headquarters Town & Region"
          value={data.headquarters}
          onChangeText={(val) => onChange({ ...data, headquarters: val })}
          placeholder="Makhu Town, District Ferozepur, Punjab, India"
        />

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="GSTIN Number"
              value={data.gstin}
              onChangeText={(val) => onChange({ ...data, gstin: val })}
              placeholder="03AAAAF0000A1Z5"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Corporate Identification Number (CIN)"
              value={data.cin}
              onChangeText={(val) => onChange({ ...data, cin: val })}
              placeholder="U01100PB2026PTC000000"
            />
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="PAN / Tax Number"
              value={data.pan}
              onChangeText={(val) => onChange({ ...data, pan: val })}
              placeholder="AAAAF0000A"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="FSSAI Food License Number"
              value={data.fssaiLicense}
              onChangeText={(val) => onChange({ ...data, fssaiLicense: val })}
              placeholder="10023064000123"
            />
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Customer Support Email"
              value={data.supportEmail}
              onChangeText={(val) => onChange({ ...data, supportEmail: val })}
              placeholder="support@farmsking.in"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Customer Support Phone Helpline"
              value={data.supportPhone}
              onChangeText={(val) => onChange({ ...data, supportPhone: val })}
              placeholder="+91 98888 12345"
            />
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Official WhatsApp Helpline"
              value={data.whatsappHelpline}
              onChangeText={(val) => onChange({ ...data, whatsappHelpline: val })}
              placeholder="+91 98888 12345"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Operating Working Hours"
              value={data.workingHours}
              onChangeText={(val) => onChange({ ...data, workingHours: val })}
              placeholder="Monday - Saturday: 9:00 AM - 6:00 PM IST"
            />
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <InputField
              label="Grievance Officer Name"
              value={data.grievanceOfficerName}
              onChangeText={(val) => onChange({ ...data, grievanceOfficerName: val })}
              placeholder="Surinder Singh"
            />
          </View>
          <View style={styles.colHalf}>
            <InputField
              label="Grievance Officer Email"
              value={data.grievanceOfficerEmail}
              onChangeText={(val) => onChange({ ...data, grievanceOfficerEmail: val })}
              placeholder="grievance@farmsking.in"
              keyboardType="email-address"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE INPUT FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  isSecret = false,
  onToggleSecret,
  keyboardType = 'default',
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isSecret?: boolean;
  onToggleSecret?: () => void;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, multiline && { height: 96, alignItems: 'flex-start', paddingTop: 8 }]}>
        <TextInput
          style={[styles.textInput, multiline && { height: 80, textAlignVertical: 'top' }]}
          value={value ?? ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          secureTextEntry={isSecret}
          keyboardType={keyboardType}
          multiline={multiline}
        />
        {onToggleSecret && (
          <TouchableOpacity onPress={onToggleSecret} style={styles.eyeBtn}>
            <Ionicons
              name={isSecret ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#94a3b8"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020d06',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020d06',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3822',
    backgroundColor: '#03140a',
  },
  headerLeft: {
    flex: 1,
    minWidth: 240,
    paddingRight: 10,
  },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,255,135,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.25)',
    marginBottom: 8,
  },
  crownText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00ff87',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  saveBtnText: {
    color: '#020d06',
    fontWeight: '800',
    fontSize: 14,
  },
  toastBanner: {
    backgroundColor: '#052e16',
    borderBottomWidth: 1,
    borderBottomColor: '#00ff87',
    paddingVertical: 10,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    color: '#00ff87',
    fontWeight: '700',
    fontSize: 13,
  },
  tabBarWrapper: {
    backgroundColor: '#04180d',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3822',
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#00ff87',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#00ff87',
    borderRadius: 2,
  },
  contentScroll: {
    flex: 1,
  },
  contentBody: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#061c10',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0f3822',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3822',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00ff87',
    letterSpacing: 1,
    marginBottom: 12,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  providerTile: {
    flexBasis: Platform.OS === 'web' ? '31%' : '48%',
    flexGrow: 1,
    backgroundColor: '#03140a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3822',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  providerTileSelected: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
  },
  providerTileName: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  providerTileNameSelected: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  activePill: {
    backgroundColor: '#00ff87',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    color: '#020d06',
    fontSize: 9,
    fontWeight: '900',
  },
  formContainer: {
    gap: 16,
  },
  fieldWrapper: {
    marginBottom: 4,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtext: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03140a',
    borderWidth: 1,
    borderColor: '#0f3822',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    paddingVertical: 10,
    outlineStyle: 'none' as any,
  },
  eyeBtn: {
    padding: 6,
  },
  twoColRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  colHalf: {
    flex: 1,
  },
  switchGroup: {
    gap: 16,
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3822',
  },
  toggleRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#03140a',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3822',
  },
  otpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  otpTile: {
    flexBasis: Platform.OS === 'web' ? '31%' : '100%',
    flexGrow: 1,
    backgroundColor: '#03140a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3822',
    padding: 14,
  },
  otpTileSelected: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
  },
  otpTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  otpTileLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  otpTileLabelSelected: {
    color: '#00ff87',
    fontWeight: '800',
  },
  otpTileDesc: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
  },
  activePillSmall: {
    alignSelf: 'flex-start',
    backgroundColor: '#00ff87',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
  },
  activePillTextSmall: {
    color: '#020d06',
    fontSize: 9,
    fontWeight: '900',
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#03140a',
    borderWidth: 1,
    borderColor: '#0f3822',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  channelChipActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.06)',
  },
  channelChipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  channelChipTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: '#03140a',
    borderWidth: 1,
    borderColor: '#0f3822',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  pillBtnActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
  },
  pillText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#00ff87',
    fontWeight: '800',
  },
  brandPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#03140a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f3822',
    padding: 16,
    marginBottom: 22,
  },
  logoPreviewWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#061c10',
    borderWidth: 1,
    borderColor: '#0f3822',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInfoPreview: {
    flex: 1,
  },
  brandTitlePreview: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  brandTaglinePreview: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  legalBadge: {
    backgroundColor: '#061c10',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0f3822',
  },
  legalBadgeText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  firebaseNotice: {
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  firebaseNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  firebaseNoticeTitle: {
    color: '#ffb74d',
    fontSize: 13,
    fontWeight: '700',
  },
  firebaseNoticeText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 60,
  },
});
