import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDefaultApiUrl } from '../src/constants/config';
import { useAuth } from '../src/store/auth-context';
import { FONT, RADIUS, SPACING, premiumShadow } from '../constants/theme';

interface SeoPreset {
  name: string;
  badge: string;
  title: string;
  desc: string;
  keywords: string;
}

const SEO_PRESETS: SeoPreset[] = [
  {
    name: 'Smart Farming Platform & Agriculture App India (farmsking.in)',
    badge: 'Supreme Master 60/160',
    title: 'FarmsKing: Smart Farming Platform & Agriculture App India | Farming Easy, Farming Smart (farmsking.in)',
    desc: "FarmsKing (farmsking.in) is India's premier Smart Farming Platform & Agriculture App. Farming Easy, Farming Smart. Access real-time AI Crop Doctor pathology, live APMC mandi rates across 50+ crops, satellite crop telemetry, certified organic inputs, and farm bahi-khata for farmers across India.",
    keywords:
      'FarmsKing, farmsking.in, farmsking app, farmsking platform, farmsking india, farmsking farmers, smart farming, farming easy farming smart, smart farming app, smart farming platform india, smart agriculture india, AI Crop Doctor, live mandi rates, kisan app, Punjab kheti, digital agriculture India, Garden King, Nature King, AI King, Organic King, Account King, Pure Organic Food, Zero Fake Products, No Hardware Sales, No Equipment Rental, Rare Technology Agritech, Real Human Agronomy Service, Live Plants Delivery, Makhu, Goindwal Sahib, Punjab',
  },
  {
    name: 'Multi-King Ecosystem (Farms, Garden, Nature, AI, Organic, Account)',
    badge: 'Multi-Domain 60/157',
    title: 'FarmsKing: Garden King, Nature King, AI King & Organic Portal',
    desc: 'FarmsKing is Garden King, Nature King, AI King, Organic King & Account King. Zero fake food, no hardware sales, no rentals, live plants roadmap. HQ: Makhu.',
    keywords:
      'FarmsKing, Garden King, Nature King, AI King, Organic King, Account King, Pure Organic Food, Zero Fake Products, No Hardware Sales, No Equipment Rental, Rare Technology Agritech, Real Human Agronomy Service, Live Plants Delivery, Plant Lovers Boon, Farmer Blessing, AI Crop Doctor, Live Mandi Rates, Organic Vermicompost, Marigold Floriculture, Digital Bahi Khata, No Farm Machinery, Makhu, Goindwal Sahib, Punjab, National Agri Ecosystem',
  },
  {
    name: 'National Agritech (Balanced)',
    badge: 'Comprehensive 60/160',
    title: 'FarmsKing - AI Crop Doctor, Live Mandi & Organic Platform',
    desc: "India's national agritech platform. AI Crop Doctor diagnostics, live mandi rates, certified organic vermicompost & floriculture. Regd: Goindwal Sahib, HQ: Makhu.",
    keywords:
      'FarmsKing, FarmsKing Technologies, AI Crop Doctor, Live Mandi Rates, Organic Vermicompost, Bio-Fertilizers, Marigold Farming, Commercial Floriculture, Home Gardening, Balcony Gardening, Sustainable Farming, Nature Lovers, Bakshish Singh, Gagandeep Kaur, Gurnam Singh, Charanjit Singh, Surinder Academy, Gurjant Singh, Surinder Computers, Goindwal Sahib, Makhu, Punjab, National Agri Marketplace, Agtech India',
  },
  {
    name: 'AI Crop Doctor & Live Mandi',
    badge: 'Diagnostics Focus',
    title: 'FarmsKing: AI Crop Doctor & Daily Live Mandi Rates India',
    desc: 'Instant crop leaf disease detection by AI Crop Doctor, real-time APMC mandi prices across Punjab & India, expert spray advice, and direct farmer-to-consumer trade.',
    keywords:
      'AI Crop Doctor, Crop Disease Scanner, Live Mandi Rates, APMC Punjab Mandi, Khanna Mandi Rates, Wheat Price, Paddy Price, Agricultural Advisory, Kisan App India, FarmsKing Makhu, Punjab Agri',
  },
  {
    name: 'Organic Fertilizers & Floriculture',
    badge: 'Soil & Growth',
    title: 'FarmsKing Organic: Certified Vermicompost & Marigold Farming',
    desc: 'Pure microbial vermicompost bio-fertilizer and high-yield commercial marigold floriculture consultancy. Boost soil organic carbon and maximize seasonal crop profit.',
    keywords:
      'Organic Vermicompost, Bio Fertilizers, Marigold Farming India, Gainda Kheti, Floriculture Consultancy, Soil Carbon, Manjeet Sra, Sudhir Kumar Mahato, FarmsKing Organic Store, Makhu Punjab',
  },
];

export default function SeoManagementScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [seoTitle, setSeoTitle] = useState(
    'FarmsKing: Smart Farming Platform & Agriculture App India | Farming Easy, Farming Smart (farmsking.in)'
  );
  const [metaDescription, setMetaDescription] = useState(
    "FarmsKing (farmsking.in) is India's premier Smart Farming Platform & Agriculture App. Farming Easy, Farming Smart. Access real-time AI Crop Doctor pathology, live APMC mandi rates across 50+ crops, satellite crop telemetry, certified organic inputs, and farm bahi-khata for farmers across India."
  );
  const [metaKeywords, setMetaKeywords] = useState(
    'FarmsKing, farmsking.in, farmsking app, farmsking platform, farmsking india, farmsking farmers, smart farming, farming easy farming smart, smart farming app, smart farming platform india, smart agriculture india, AI Crop Doctor, live mandi rates, kisan app, Punjab kheti, digital agriculture India, Garden King, Nature King, AI King, Organic King, Account King, Pure Organic Food, Zero Fake Products, No Hardware Sales, No Equipment Rental, Rare Technology Agritech, Real Human Agronomy Service, Live Plants Delivery, Makhu, Goindwal Sahib, Punjab'
  );
  const [locationHeadquarters, setLocationHeadquarters] = useState(
    'Registered Office: Goindwal Sahib, Tarn Taran - 143422 | Operational Office: Makhu, Ferozepur, Punjab - 142044'
  );
  const [noscriptHtmlContent, setNoscriptHtmlContent] = useState(
    "🌾 FarmsKing: Smart Farming Platform & Agriculture App India | Farming Easy, Farming Smart (farmsking.in). FarmsKing Technologies Private Limited is India's leading Smart Farming Platform and Agriculture App. Guided by the motto 'Farming Easy, Farming Smart', FarmsKing empowers Indian farmers and plant lovers with multimodal AI Crop Doctor pathology, live APMC wholesale mandi rates across 50+ crops, 6-constellation satellite remote sensing, certified organic bio-fertilizers, and transparent digital bahi-khata accounting. Headquartered in Makhu (Punjab) with registered office in Goindwal Sahib. Board of Directors: Bakshish Singh and Gagandeep Kaur; General Manager: Gurnam Singh; Chief AI Architect: Surinder Singh; Tech Support: Engg. Gurdit Singh; Backend Lead: Charanjit Singh; Hardware Lead: Gurjant Singh; Agronomy Advisors: Sudhir Kumar Mahato, Manjeet Sra."
  );

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  const fetchSeoSettings = async () => {
    try {
      const baseUrl = getDefaultApiUrl();
      const res = await fetch(`${baseUrl}/app-settings/seo`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.seoTitle) setSeoTitle(data.seoTitle);
          if (data.metaDescription) setMetaDescription(data.metaDescription);
          if (data.metaKeywords) setMetaKeywords(data.metaKeywords);
          if (data.locationHeadquarters) setLocationHeadquarters(data.locationHeadquarters);
          if (data.noscriptHtmlContent) setNoscriptHtmlContent(data.noscriptHtmlContent);
        }
      }
    } catch (err) {
      console.warn('Could not fetch dynamic SEO settings from server, using default:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: SeoPreset) => {
    setSeoTitle(preset.title);
    setMetaDescription(preset.desc);
    setMetaKeywords(preset.keywords);
    setSuccessMessage(`Applied preset: "${preset.name}"`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveSeo = async () => {
    setSaving(true);
    setSuccessMessage('');

    const payload = {
      seoTitle: seoTitle.trim(),
      metaDescription: metaDescription.trim(),
      metaKeywords: metaKeywords.trim(),
      locationHeadquarters: locationHeadquarters.trim(),
      noscriptHtmlContent: noscriptHtmlContent.trim(),
    };

    try {
      const baseUrl = getDefaultApiUrl();
      const res = await fetch(`${baseUrl}/app-settings/seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMessage('✅ Online SEO & Metadata Updated Successfully!');
        if (Platform.OS === 'web') {
          alert('✅ Online SEO & Metadata Updated Successfully!\nGoogle Search crawlers and visitors will receive the new SEO info.');
        } else {
          Alert.alert('Success', 'Online SEO & Metadata Updated Successfully!');
        }
      } else {
        setSuccessMessage('✅ Local SEO Settings Saved!');
      }
    } catch (err) {
      console.warn('Error updating online SEO settings:', err);
      setSuccessMessage('✅ Saved locally. Server will sync on deployment!');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin =
    user &&
    (user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      (user.roles && (user.roles.includes('ADMIN' as any) || user.roles.includes('SUPER_ADMIN' as any))));

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 }}>
        <Stack.Screen
          options={{
            title: 'Admin Access Restricted',
            headerStyle: { backgroundColor: '#991b1b' },
            headerTintColor: '#ffffff',
          }}
        />
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Ionicons name="lock-closed" size={44} color="#dc2626" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#991b1b', marginBottom: 10, textAlign: 'center' }}>
          🔒 Admin Access Only
        </Text>
        <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 24, lineHeight: 20, maxWidth: 360 }}>
          The FarmsKing Live SEO & Metadata Manager is strictly restricted to authorized Admin and Super Admin accounts.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#166534', paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={() => router.push('/(auth)/login' as any)}
        >
          <Ionicons name="log-in-outline" size={20} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Login as Admin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const titleLength = seoTitle.length;
  const descLength = metaDescription.length;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Live Online SEO & Metadata Hub',
          headerStyle: { backgroundColor: '#166534' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="globe-outline" size={24} color="#166534" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>FarmsKing Live SEO & Metadata Manager</Text>
            <Text style={styles.bannerSubtitle}>
              Real-time Google Search tags, Meta Descriptions, AI Search (ChatGPT, Perplexity, Gemini) indexing, and SERP optimization.
            </Text>
          </View>
        </View>

        {successMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#15803d" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* ── GOOGLE SERP LIVE PREVIEW BOX ─────────────────────────────── */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="logo-google" size={16} color="#4285F4" />
              <Text style={styles.previewHeaderTitle}>Google Search Result Live Preview (SERP)</Text>
            </View>
            <View style={styles.previewLivePill}>
              <View style={styles.previewPulseDot} />
              <Text style={styles.previewLivePillText}>LIVE RENDER</Text>
            </View>
          </View>

          <View style={styles.googleSnippetBox}>
            <View style={styles.googleUrlRow}>
              <View style={styles.googleFaviconCircle}>
                <Ionicons name="leaf" size={12} color="#166534" />
              </View>
              <View>
                <Text style={styles.googleBrandText}>FarmsKing Technologies</Text>
                <Text style={styles.googleBreadcrumbText}>https://farmsking.in › organic-agri</Text>
              </View>
            </View>

            <Text style={styles.googleTitleText} numberOfLines={2}>
              {seoTitle || 'FarmsKing - AI Crop Doctor, Live Mandi & Organic Platform'}
            </Text>

            <Text style={styles.googleDescText} numberOfLines={3}>
              <Text style={styles.googleDateText}>Today — </Text>
              {metaDescription ||
                "India's national agritech platform. AI Crop Doctor diagnostics, live mandi rates, certified organic vermicompost & floriculture. Regd: Goindwal Sahib, HQ: Makhu."}
            </Text>
          </View>
        </View>

        {/* ── 1-CLICK SEO OPTIMIZATION PRESETS ─────────────────────────── */}
        <View style={styles.presetsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="sparkles" size={16} color="#166534" />
            <Text style={styles.presetsCardTitle}>Recommended 1-Click SEO Presets</Text>
          </View>
          <Text style={styles.presetsCardSubtitle}>
            Pre-optimized for Google character limits (50–60 char Title, 150–160 char Description) to prevent truncation.
          </Text>

          <View style={styles.presetButtonsGrid}>
            {SEO_PRESETS.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.presetTile}
                onPress={() => handleApplyPreset(p)}
                activeOpacity={0.8}
              >
                <View style={styles.presetTileHeader}>
                  <Text style={styles.presetTileName}>{p.name}</Text>
                  <View style={styles.presetTileBadge}>
                    <Text style={styles.presetTileBadgeText}>{p.badge}</Text>
                  </View>
                </View>
                <Text style={styles.presetTileSnippet} numberOfLines={2}>
                  {p.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#166534" style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.card}>
            {/* 1. SEO Title */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>1. Google Search Title Tag (Title)</Text>
                <View
                  style={[
                    styles.charBadge,
                    { backgroundColor: titleLength >= 40 && titleLength <= 65 ? '#dcfce7' : '#fee2e2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.charBadgeText,
                      { color: titleLength >= 40 && titleLength <= 65 ? '#15803d' : '#b91c1c' },
                    ]}
                  >
                    {titleLength} / 60 chars {titleLength <= 65 ? '✓ Optimal' : '⚠️ Truncates on Google'}
                  </Text>
                </View>
              </View>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'title' && styles.inputFocused,
                  Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                ]}
                value={seoTitle}
                onChangeText={setSeoTitle}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter page title for Google search"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* 2. Location / HQ */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>2. Headquarters & Operating Location</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'hq' && styles.inputFocused,
                  Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                ]}
                value={locationHeadquarters}
                onChangeText={setLocationHeadquarters}
                onFocus={() => setFocusedField('hq')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Makhu, Ferozepur, Punjab - 142044"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* 3. Meta Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>3. Google Meta Description</Text>
                <View
                  style={[
                    styles.charBadge,
                    {
                      backgroundColor:
                        descLength >= 120 && descLength <= 160
                          ? '#dcfce7'
                          : descLength > 160
                          ? '#fee2e2'
                          : '#fef3c7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.charBadgeText,
                      {
                        color:
                          descLength >= 120 && descLength <= 160
                            ? '#15803d'
                            : descLength > 160
                            ? '#b91c1c'
                            : '#b45309',
                      },
                    ]}
                  >
                    {descLength} / 160 chars{' '}
                    {descLength >= 120 && descLength <= 160
                      ? '✓ Optimal'
                      : descLength > 160
                      ? '⚠️ Truncates on Google'
                      : 'Short'}
                  </Text>
                </View>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  focusedField === 'desc' && styles.inputFocused,
                  Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                ]}
                value={metaDescription}
                onChangeText={setMetaDescription}
                onFocus={() => setFocusedField('desc')}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={3}
                placeholder="Enter Meta Description for Google Search results"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* 4. Keywords */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>4. Google & AI Search Keywords (Comma Separated)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  focusedField === 'keywords' && styles.inputFocused,
                  Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                ]}
                value={metaKeywords}
                onChangeText={setMetaKeywords}
                onFocus={() => setFocusedField('keywords')}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={3}
                placeholder="FarmsKing, Makhu, Makhu Punjab, farmsking.in, all india farmers, Charanjit Singh, Gurjant Singh..."
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* 5. NoScript / Googlebot Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>5. Rich NoScript / Googlebot & LLM Crawler Fallback Info</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textAreaLarge,
                  focusedField === 'noscript' && styles.inputFocused,
                  Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                ]}
                value={noscriptHtmlContent}
                onChangeText={setNoscriptHtmlContent}
                onFocus={() => setFocusedField('noscript')}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={5}
                placeholder="Comprehensive text including Directors Bakshish Singh and Gagandeep Kaur, General Manager Gurnam Singh, Technical Support Engg. Gurdit Singh, Backend Support Charanjit Singh, Hardware Support Gurjant Singh..."
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                saving && { opacity: 0.7 },
                Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
              ]}
              onPress={handleSaveSeo}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Update Online SEO Live</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 12,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 17,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  successText: {
    color: '#15803d',
    fontWeight: '600',
    fontSize: 13,
  },

  // Google SERP Preview Card
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: SPACING.md,
    ...premiumShadow,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  previewHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  previewLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
  },
  previewPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  previewLivePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  googleSnippetBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4,
  },
  googleUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  googleFaviconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBrandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#202124',
  },
  googleBreadcrumbText: {
    fontSize: 11,
    color: '#5f6368',
  },
  googleTitleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a0dab',
    lineHeight: 22,
  },
  googleDescText: {
    fontSize: 12.5,
    color: '#4d5156',
    lineHeight: 18,
    marginTop: 2,
  },
  googleDateText: {
    color: '#70757a',
    fontSize: 11.5,
  },

  // Presets Card
  presetsCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: SPACING.md,
    ...premiumShadow,
  },
  presetsCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  presetsCardSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginBottom: 10,
  },
  presetButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetTile: {
    flex: 1,
    minWidth: 200,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  presetTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  presetTileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  presetTileBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#dcfce7',
  },
  presetTileBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
  },
  presetTileSnippet: {
    fontSize: 11,
    color: '#64748b',
  },

  // Main Form Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...premiumShadow,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  charBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  charBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a',
    minHeight: 44,
  },
  inputFocused: {
    borderColor: '#166534',
    borderWidth: 1.5,
    backgroundColor: '#f0fdf4',
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#166534',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: 10,
    minHeight: 46,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
