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
import { BrandLogo } from '@/src/components/BrandLogo';
import { router } from 'expo-router';

type TabKey = 'product' | 'social' | 'about';

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

const TABS: TabItem[] = [
  { key: 'product', label: 'Product Settings', icon: 'cube-outline', badge: 'Store Rules' },
  { key: 'social', label: 'Social & SSO', icon: 'share-social-outline' },
  { key: 'about', label: 'Company & Legal', icon: 'business-outline', badge: 'CIN/GST' },
];

export default function CPanelScreen() {
  const { data: remoteConfig, isLoading, isError, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [activeTab, setActiveTab] = useState<TabKey>('product');
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
          <Text style={styles.headerTitle}>⚡ C-Panel — Platform Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure marketplace rules, commission fees, social channels, Google SSO, and statutory company profile. For API services, use the centralized API tab.
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

      {/* ── Centralized API Navigation Banner ──────────────────── */}
      <View style={styles.apiBannerCard}>
        <View style={styles.apiBannerLeft}>
          <View style={styles.apiBannerIconBox}>
            <Ionicons name="git-network" size={20} color="#00ff87" />
          </View>
          <View style={{ flex: 1, minWidth: 220 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.apiBannerTitle}>Third-Party Services Consolidated</Text>
              <View style={styles.unifiedTag}>
                <Text style={styles.unifiedTagText}>SETTINGS ➔ API</Text>
              </View>
            </View>
            <Text style={styles.apiBannerSubtitle}>
              All 8 third-party integrations (Payment Gateways, SMS & OTP, WhatsApp, AI Crop Doctor, Agora Video, Weather, Logistics & Cloud Storage) have been consolidated into Settings ➔ API.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.apiBannerBtn}
          onPress={() => router.push('/admin/(tabs)/super-settings?section=API')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00ff87', '#00b050']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.apiBannerBtnGrad}
          >
            <Ionicons name="git-network-outline" size={15} color="#020d06" />
            <Text style={styles.apiBannerBtnText}>Open API Settings</Text>
            <Ionicons name="arrow-forward" size={14} color="#020d06" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
          {data.logoUrl && !data.logoUrl.includes('farmsking.in/assets/logo.png') && data.logoUrl !== 'https://farmsking.in/brand_logo.png' ? (
            <Image source={{ uri: data.logoUrl }} style={styles.logoPreviewImage} resizeMode="contain" />
          ) : (
            <BrandLogo size={52} useHdQuality={true} />
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
              placeholder="e.g. FARMSKING TECHNOLOGIES PRIVATE LIMITED"
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
              placeholder="https://farmsking.in/brand_logo.png"
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
  apiBannerCard: {
    backgroundColor: '#041b0e',
    borderColor: '#0f3822',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  apiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  apiBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  apiBannerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  unifiedTag: {
    backgroundColor: 'rgba(0, 255, 135, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00ff87',
  },
  unifiedTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#00ff87',
  },
  apiBannerBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 38,
  },
  apiBannerBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  apiBannerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#020d06',
  },
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
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3822',
    backgroundColor: '#03140a',
  },
  headerLeft: {
    flex: 1,
    minWidth: 200,
    paddingRight: 8,
  },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,255,135,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.25)',
    marginBottom: 4,
  },
  crownText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#00ff87',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveBtnText: {
    color: '#020d06',
    fontWeight: '800',
    fontSize: 12.5,
  },
  toastBanner: {
    backgroundColor: '#052e16',
    borderBottomWidth: 1,
    borderBottomColor: '#00ff87',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toastText: {
    color: '#00ff87',
    fontWeight: '700',
    fontSize: 12,
  },
  tabBarWrapper: {
    backgroundColor: '#04180d',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3822',
  },
  tabBar: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#00ff87',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: '#00ff87',
    borderRadius: 2,
  },
  contentScroll: {
    flex: 1,
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'web' ? 24 : 32,
  },
  card: {
    backgroundColor: '#061c10',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0f3822',
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3822',
  },
  cardTitle: {
    fontSize: 15.5,
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
    gap: 18,
  },
  fieldWrapper: {
    marginBottom: 8,
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
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    paddingVertical: 12,
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
    height: Platform.OS === 'web' ? 16 : 24,
  },
});
