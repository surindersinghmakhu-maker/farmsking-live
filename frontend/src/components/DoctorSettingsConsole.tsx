import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useDoctorSettings, useUpdateDoctorSettings } from '@/src/hooks/useDoctorSettings';
import { useExecutiveTheme } from '@/src/store/theme-context';
import type { DoctorSettingsResponse } from '@/src/api/doctorSettings.api';
import { INITIAL_CROPS_LIST, CROP_CATEGORIES } from '@/constants/cropCategoriesData';

// All Indian crops available across FarmsKing
const ALL_SYSTEM_CROPS_DEFAULT = INITIAL_CROPS_LIST.map((c) => c.name);

export const DoctorSettingsConsole: React.FC<{ advisorId?: string }> = ({ advisorId }) => {
  const router = useRouter();
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const { data: settings, isLoading } = useDoctorSettings(advisorId);
  const updateMutation = useUpdateDoctorSettings(advisorId);

  const [activeCPanelTab, setActiveCPanelTab] = useState<'PROFILE' | 'PLANS'>('PROFILE');
  const [form, setForm] = useState<Partial<DoctorSettingsResponse>>({});
  const [savedNotice, setSavedNotice] = useState(false);
  const [customCropInput, setCustomCropInput] = useState('');
  const [selectedCropCategory, setSelectedCropCategory] = useState<string>('all');
  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Master system crops with category mapping & doctor custom additions
  const masterSystemCrops = React.useMemo(() => {
    const list: { id: string; name: string; categoryId: string; categoryName: string }[] = [];
    const seen = new Set<string>();

    INITIAL_CROPS_LIST.forEach((c) => {
      const clean = c.name.trim();
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        const cat = CROP_CATEGORIES.find((cat) => cat.id === c.categoryId);
        list.push({ id: c.id, name: clean, categoryId: c.categoryId, categoryName: cat?.name || 'General' });
      }
    });

    (form.specializedCrops || []).forEach((c) => {
      const clean = c.trim();
      const lower = clean.toLowerCase();
      if (clean && !seen.has(lower)) {
        seen.add(lower);
        list.push({ id: `custom-${clean}`, name: clean, categoryId: 'other', categoryName: 'Custom / Other' });
      }
    });

    return list;
  }, [form.specializedCrops]);

  // Filtered system crops by search query, category, and selected-only toggle
  const filteredSystemCrops = React.useMemo(() => {
    return masterSystemCrops.filter((crop) => {
      if (selectedCropCategory !== 'all' && crop.categoryId !== selectedCropCategory) {
        return false;
      }
      if (showSelectedOnly) {
        const isSel = (form.specializedCrops || []).includes(crop.name);
        if (!isSel) return false;
      }
      if (cropSearchQuery.trim()) {
        const q = cropSearchQuery.trim().toLowerCase();
        return crop.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [masterSystemCrops, selectedCropCategory, showSelectedOnly, cropSearchQuery, form.specializedCrops]);

  const handleSelectAllFiltered = () => {
    const current = new Set(form.specializedCrops || []);
    filteredSystemCrops.forEach((c) => current.add(c.name));
    setForm((prev) => ({ ...prev, specializedCrops: Array.from(current) }));
  };

  const handleClearFiltered = () => {
    const namesToClear = new Set(filteredSystemCrops.map((c) => c.name));
    const remaining = (form.specializedCrops || []).filter((name) => !namesToClear.has(name));
    setForm((prev) => ({ ...prev, specializedCrops: remaining }));
  };

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
    }
  }, [settings]);

  const handleToggle = (key: keyof DoctorSettingsResponse) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCropToggle = (crop: string) => {
    const list = form.specializedCrops ? [...form.specializedCrops] : [];
    const index = list.indexOf(crop);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(crop);
    }
    setForm((prev) => ({ ...prev, specializedCrops: list }));
  };

  const handleAddCustomCrop = () => {
    if (!customCropInput.trim()) return;
    const crop = customCropInput.trim();
    const list = form.specializedCrops ? [...form.specializedCrops] : [];
    if (!list.includes(crop)) {
      list.push(crop);
      setForm((prev) => ({ ...prev, specializedCrops: list }));
    }
    setCustomCropInput('');
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(form);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
      if (Platform.OS === 'web') {
        // saved
      } else {
        Alert.alert('Settings Saved', 'Your doctor settings and plans have been updated successfully.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not save doctor settings.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  if (isLoading || !form) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading Doctor Governance Settings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.mainHeading, { color: textColor }]}>
            C-Panel (Doctor Governance Console)
          </Text>
          <Text style={[styles.mainSub, { color: subTextColor }]}>
            Manage your doctor profile, statutory credentials, consultation plans, and crop fees.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.7 }]}
          disabled={updateMutation.isPending}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name={savedNotice ? 'checkmark-circle' : 'save'} size={16} color="#ffffff" />
              <Text style={styles.saveBtnText}>{savedNotice ? 'Saved!' : 'Save Settings'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {savedNotice && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#15803d" />
          <Text style={styles.successBannerText}>
            Doctor settings and consultation parameters synchronized across all platforms.
          </Text>
        </View>
      )}

            {/* C-PANEL DUAL TABS: Doctor Profile & Plans */}
      <View
        style={[
          styles.cpanelTabContainer,
          {
            backgroundColor: isLight ? '#f1f5f9' : '#090e17',
            borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.cpanelTabBtn,
            activeCPanelTab === 'PROFILE' && [
              styles.cpanelTabBtnActive,
              { backgroundColor: isLight ? '#ffffff' : '#1e293b' },
            ],
          ]}
          onPress={() => setActiveCPanelTab('PROFILE')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person-circle"
            size={19}
            color={activeCPanelTab === 'PROFILE' ? '#10b981' : (isLight ? '#64748b' : '#94a3b8')}
          />
          <Text
            style={[
              styles.cpanelTabBtnText,
              { color: activeCPanelTab === 'PROFILE' ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8') },
              activeCPanelTab === 'PROFILE' && { fontFamily: FONT.bold },
            ]}
          >
            Doctor Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cpanelTabBtn,
            activeCPanelTab === 'PLANS' && [
              styles.cpanelTabBtnActive,
              { backgroundColor: isLight ? '#ffffff' : '#1e293b' },
            ],
          ]}
          onPress={() => setActiveCPanelTab('PLANS')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="pricetags"
            size={18}
            color={activeCPanelTab === 'PLANS' ? '#10b981' : (isLight ? '#64748b' : '#94a3b8')}
          />
          <Text
            style={[
              styles.cpanelTabBtnText,
              { color: activeCPanelTab === 'PLANS' ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8') },
              activeCPanelTab === 'PLANS' && { fontFamily: FONT.bold },
            ]}
          >
            Plans
          </Text>
        </TouchableOpacity>
      </View>

      {activeCPanelTab === 'PROFILE' ? (
        <>
          {/* SECTION 4: Agronomy Credential & Prescriptions Signature */}
      <View style={[styles.sectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.iconBadgePurple}>
            <Ionicons name="ribbon" size={18} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Agronomy Credentials & Prescription Stamp
            </Text>
            <Text style={[styles.sectionSub, { color: subTextColor }]}>
              Appears on digital prescriptions (E-Parchi) with FarmsKing statutory verified QR seal.
            </Text>
          </View>
        </View>

        <View style={styles.timingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: subTextColor }]}>ICAR / Agri Registration Number</Text>
            <TextInput
              style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
              value={form.icarRegistrationNumber || ''}
              placeholder="e.g. ICAR-DOC-2026-8812"
              placeholderTextColor={subTextColor}
              onChangeText={(v) => setForm((prev) => ({ ...prev, icarRegistrationNumber: v }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: subTextColor }]}>Max Active Farmer Capacity</Text>
            <TextInput
              style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
              keyboardType="numeric"
              value={String(form.maxFarmerCapacity || 100)}
              onChangeText={(v) => setForm((prev) => ({ ...prev, maxFarmerCapacity: Number(v) || 50 }))}
            />
          </View>
        </View>

        <View style={{ marginTop: 8, gap: 4 }}>
          <Text style={[styles.inputLabel, { color: subTextColor }]}>Doctor Title & Academic Degree</Text>
          <TextInput
            style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
            value={form.qualificationTitle || ''}
            placeholder="e.g. M.Sc Agronomy · ICAR Certified Plant Pathologist"
            placeholderTextColor={subTextColor}
            onChangeText={(v) => setForm((prev) => ({ ...prev, qualificationTitle: v }))}
          />
        </View>
      
        {/* Certificate & Photo Studio Navigation Card */}
        <TouchableOpacity
          style={[
            styles.certNavCard,
            {
              backgroundColor: isLight ? '#f8fafc' : 'rgba(16, 185, 129, 0.06)',
              borderColor: isLight ? '#e2e8f0' : 'rgba(16, 185, 129, 0.25)',
            },
          ]}
          onPress={() => router.push('/advisor-profile')}
          activeOpacity={0.85}
        >
          <View style={styles.certNavLeft}>
            <View style={styles.certRibbonBox}>
              <Ionicons name="ribbon" size={22} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.certNavTitle, { color: textColor }]}>
                Official Crop Doctor Certificate & Photograph
              </Text>
              <Text style={[styles.certNavSub, { color: subTextColor }]}>
                Download official A4 Certificate of Excellence and update your public doctor photograph.
              </Text>
            </View>
          </View>
          <View style={styles.certNavArrow}>
            <Text style={styles.certNavBtnText}>Open Studio</Text>
            <Ionicons name="chevron-forward" size={15} color="#10b981" />
          </View>
        </TouchableOpacity>
</View>

          {/* SECTION 3: Availability & Practice Timings */}
      <View style={[styles.sectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.iconBadgeAmber}>
            <Ionicons name="time" size={18} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Availability Status & Working Hours
            </Text>
            <Text style={[styles.sectionSub, { color: subTextColor }]}>
              Let farmers know when you are active for instant consultations.
            </Text>
          </View>
        </View>

        {/* Status Selector */}
        <View style={styles.statusRow}>
          {(['AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((st) => {
            const isCur = form.availabilityStatus === st;
            const color = st === 'AVAILABLE' ? '#10b981' : st === 'BUSY' ? '#f59e0b' : '#ef4444';
            const label = st === 'AVAILABLE' ? '🟢 Available' : st === 'BUSY' ? '🟡 In Field / Busy' : '🔴 Offline';
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor: isCur ? `${color}25` : isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                    borderColor: isCur ? color : isLight ? '#e2e8f0' : '#1e293b',
                  },
                ]}
                onPress={() => setForm((prev) => ({ ...prev, availabilityStatus: st }))}
              >
                <Text style={[styles.statusBtnText, { color: isCur ? color : subTextColor }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Timings */}
        <View style={styles.timingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: subTextColor }]}>Consultation Start Time</Text>
            <TextInput
              style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
              value={form.workingHoursStart || '09:00 AM'}
              onChangeText={(v) => setForm((prev) => ({ ...prev, workingHoursStart: v }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: subTextColor }]}>Consultation End Time</Text>
            <TextInput
              style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
              value={form.workingHoursEnd || '07:00 PM'}
              onChangeText={(v) => setForm((prev) => ({ ...prev, workingHoursEnd: v }))}
            />
          </View>
        </View>

        {/* Emergency Calls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.toggleTitle, { color: textColor }]}>Accept Emergency Night / Holiday Alerts</Text>
            <Text style={[styles.toggleDesc, { color: subTextColor }]}>
              Allow urgent alerts for sudden locust attacks, storm damage, or rapid pest outbreaks outside regular hours.
            </Text>
          </View>
          <Switch
            value={Boolean(form.emergencyConsultation)}
            onValueChange={() => handleToggle('emergencyConsultation')}
            trackColor={{ false: '#64748b', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Welcome Greeting Note */}
        <View style={{ marginTop: 10, gap: 4 }}>
          <Text style={[styles.inputLabel, { color: subTextColor }]}>Automated Greeting Note for New Farmers</Text>
          <TextInput
            style={[styles.multilineInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
            multiline
            numberOfLines={2}
            value={form.welcomeGreeting || ''}
            onChangeText={(v) => setForm((prev) => ({ ...prev, welcomeGreeting: v }))}
            placeholder="Write a welcome greeting for farmers attached to your clinic..."
            placeholderTextColor={subTextColor}
          />
        </View>
      </View>

          {/* SECTION 1: Contact Privacy & Communication Channels */}
      <View style={[styles.sectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.iconBadgeGreen}>
            <Ionicons name="shield-checkmark" size={18} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Contact Privacy & Communication Channels
            </Text>
            <Text style={[styles.sectionSub, { color: subTextColor }]}>
              Control how assigned farmers reach you for agronomy advice.
            </Text>
          </View>
        </View>

        <View style={styles.toggleList}>
          {/* 1. Hide/Show Mobile Number */}
          <View style={[styles.toggleRow, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.toggleTitle, { color: textColor }]}>Show Mobile Number to Farmers</Text>
                <View
                  style={[
                    styles.privacyTag,
                    {
                      backgroundColor: form.showMobileNumber
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.privacyTagText,
                      { color: form.showMobileNumber ? '#3b82f6' : '#10b981' },
                    ]}
                  >
                    {form.showMobileNumber ? '📞 Number Visible' : '🔒 100% Private (VOIP Only)'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.toggleDesc, { color: subTextColor }]}>
                When disabled, your phone number is protected. Farmers can only contact you via encrypted In-App calling and messenger.
              </Text>
            </View>
            <Switch
              value={Boolean(form.showMobileNumber)}
              onValueChange={() => handleToggle('showMobileNumber')}
              trackColor={{ false: '#64748b', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* 2. WhatsApp Messaging */}
          <View style={[styles.toggleRow, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: textColor }]}>Direct WhatsApp Consultations</Text>
              <Text style={[styles.toggleDesc, { color: subTextColor }]}>
                Display a WhatsApp button on your consultation cards so farmers can send crop photos.
              </Text>
            </View>
            <Switch
              value={Boolean(form.enableWhatsApp)}
              onValueChange={() => handleToggle('enableWhatsApp')}
              trackColor={{ false: '#64748b', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* 3. Direct GSM Calling */}
          <View style={[styles.toggleRow, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: textColor }]}>Direct Cellular GSM Phone Calling</Text>
              <Text style={[styles.toggleDesc, { color: subTextColor }]}>
                Permit farmers to place standard telephone SIM calls to your registered number.
              </Text>
            </View>
            <Switch
              value={Boolean(form.enableGsmCalling)}
              onValueChange={() => handleToggle('enableGsmCalling')}
              trackColor={{ false: '#64748b', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* 4. In-App Audio Voice Calling */}
          <View style={[styles.toggleRow, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: textColor }]}>In-App VoIP Encrypted Voice Calls</Text>
              <Text style={[styles.toggleDesc, { color: subTextColor }]}>
                High-definition secure voice calls directly through the FarmsKing mobile app and web platform.
              </Text>
            </View>
            <Switch
              value={Boolean(form.enableInAppAudioCall)}
              onValueChange={() => handleToggle('enableInAppAudioCall')}
              trackColor={{ false: '#64748b', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* 5. In-App Video Inspection Calling */}
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: textColor }]}>In-App HD Video Crop Inspection</Text>
              <Text style={[styles.toggleDesc, { color: subTextColor }]}>
                Live video consultation to inspect leaf discoloration, fungal spots, and crop canopy live with farmers.
              </Text>
            </View>
            <Switch
              value={Boolean(form.enableVideoCall)}
              onValueChange={() => handleToggle('enableVideoCall')}
              trackColor={{ false: '#64748b', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>
        </>
      ) : (
        <>
          {/* SECTION 2: Consultation Plans & Pricing Model */}
      <View style={[styles.sectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.iconBadgeBlue}>
            <Ionicons name="pricetags" size={18} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Consultation Plans, Pricing & Entitlements
            </Text>
            <Text style={[styles.sectionSub, { color: subTextColor }]}>
              Configure your fees for monthly retainers, full-season crop care, and SOS prescriptions.
            </Text>
          </View>
        </View>

        {/* 3 Tier Pricing Cards */}
        <View style={styles.pricingGrid}>
          {/* Tier 1: Monthly VIP Retainer */}
          <View style={[styles.planBox, { backgroundColor: isLight ? '#f8fafc' : '#070f1a', borderColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.planBoxTitle, { color: textColor }]}>1. Monthly Farm Retainer</Text>
              <View style={styles.planDurationBadge}>
                <Text style={styles.planDurationText}>30 Days</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Monthly Advisory Fee (₹)</Text>
              <TextInput
                style={[styles.priceInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
                keyboardType="numeric"
                value={String(form.monthlyFee ?? 299)}
                onChangeText={(v) => setForm((prev) => ({ ...prev, monthlyFee: Number(v) || 0 }))}
              />
            </View>

            <View style={styles.quotaRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quotaLabel, { color: subTextColor }]}>Call Quota / mo</Text>
                <TextInput
                  style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
                  keyboardType="numeric"
                  value={String(form.monthlyCallLimit ?? 5)}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, monthlyCallLimit: Number(v) || 0 }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quotaLabel, { color: subTextColor }]}>In-App VoIP Calls</Text>
                <TextInput
                  style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
                  keyboardType="numeric"
                  value={String(form.monthlyInAppCallLimit ?? 3)}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, monthlyInAppCallLimit: Number(v) || 0 }))}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={[styles.quotaLabel, { color: subTextColor }]}>Video Calls Allowed</Text>
              <Switch
                value={Boolean(form.monthlyVideoAllowed)}
                onValueChange={() => handleToggle('monthlyVideoAllowed')}
                trackColor={{ false: '#64748b', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Tier 2: Full Season Crop Care */}
          <View style={[styles.planBox, { backgroundColor: isLight ? '#f8fafc' : '#070f1a', borderColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.planBoxTitle, { color: textColor }]}>2. Full Season Crop Care</Text>
              <View style={styles.planDurationBadge}>
                <Text style={styles.planDurationText}>120 Days</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Full Season Fee (₹)</Text>
              <TextInput
                style={[styles.priceInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
                keyboardType="numeric"
                value={String(form.cropSeasonFee ?? 499)}
                onChangeText={(v) => setForm((prev) => ({ ...prev, cropSeasonFee: Number(v) || 0 }))}
              />
            </View>

            <View style={styles.quotaRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quotaLabel, { color: subTextColor }]}>Season Call Quota</Text>
                <TextInput
                  style={[styles.smallInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
                  keyboardType="numeric"
                  value={String(form.cropSeasonCallLimit ?? 10)}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, cropSeasonCallLimit: Number(v) || 0 }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quotaLabel, { color: subTextColor }]}>Video Inspections</Text>
                <View style={{ height: 38, justifyContent: 'center' }}>
                  <Switch
                    value={Boolean(form.cropSeasonVideoAllowed)}
                    onValueChange={() => handleToggle('cropSeasonVideoAllowed')}
                    trackColor={{ false: '#64748b', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Tier 3: Single Prescription Consultation */}
          <View style={[styles.planBox, { backgroundColor: isLight ? '#f8fafc' : '#070f1a', borderColor: isLight ? '#e2e8f0' : '#1e293b' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.planBoxTitle, { color: textColor }]}>3. Single Consultation</Text>
              <View style={styles.planDurationBadge}>
                <Text style={styles.planDurationText}>1 Visit / SOS</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Per Consultation Fee (₹)</Text>
              <TextInput
                style={[styles.priceInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
                keyboardType="numeric"
                value={String(form.singleConsultationFee ?? 150)}
                onChangeText={(v) => setForm((prev) => ({ ...prev, singleConsultationFee: Number(v) || 0 }))}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.quotaLabel, { color: textColor }]}>First Consultation Free</Text>
                <Text style={{ fontSize: 9.5, color: subTextColor }}>Offer 1st session free for new farmers</Text>
              </View>
              <Switch
                value={Boolean(form.freeConsultationEnabled)}
                onValueChange={() => handleToggle('freeConsultationEnabled')}
                trackColor={{ false: '#64748b', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Crops Selection & All-Crops Feature */}
        <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: isLight ? '#f1f5f9' : '#1e293b', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: textColor }]}>
                Provide Advisory for All Crops (Universal Doctor)
              </Text>
              <Text style={[styles.toggleDesc, { color: subTextColor }]}>
                Enable this if you serve all seasonal grains, cash crops, vegetables, and horticulture crops.
              </Text>
            </View>
            <Switch
              value={Boolean(form.allCropsSelected)}
              onValueChange={() => handleToggle('allCropsSelected')}
              trackColor={{ false: '#64748b', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Specialized Crop Tags */}
          <View style={{ marginTop: 6, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <Text style={[styles.inputLabel, { color: subTextColor, marginBottom: 0 }]}>
                Selected Crop Specializations ({form.allCropsSelected ? 'All Crops (Universal)' : `${form.specializedCrops?.length ?? 0} of ${masterSystemCrops.length} Selected`}):
              </Text>
              {!form.allCropsSelected && (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.cropActionBtn, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}
                    onPress={handleSelectAllFiltered}
                  >
                    <Ionicons name="checkmark-done" size={12} color="#10b981" />
                    <Text style={[styles.cropActionBtnText, { color: '#10b981' }]}>Select Filtered</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cropActionBtn, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}
                    onPress={handleClearFiltered}
                  >
                    <Ionicons name="close" size={12} color="#ef4444" />
                    <Text style={[styles.cropActionBtnText, { color: '#ef4444' }]}>Clear Filtered</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {!form.allCropsSelected && (
              <>
                {/* Search Bar & Filter Options */}
                <View style={styles.cropSearchRow}>
                  <View style={[styles.cropSearchInputWrapper, { backgroundColor: isLight ? '#ffffff' : '#0f172a', borderColor: isLight ? '#cbd5e1' : '#334155' }]}>
                    <Ionicons name="search" size={14} color={subTextColor} />
                    <TextInput
                      style={[styles.cropSearchInput, { color: textColor }]}
                      placeholder="Search system crops (e.g. Wheat, Basmati, Potato, Marigold)..."
                      placeholderTextColor={subTextColor}
                      value={cropSearchQuery}
                      onChangeText={setCropSearchQuery}
                    />
                    {cropSearchQuery ? (
                      <TouchableOpacity onPress={() => setCropSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={subTextColor} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.selectedOnlyToggleBtn,
                      showSelectedOnly && styles.selectedOnlyToggleBtnActive,
                      { borderColor: showSelectedOnly ? '#10b981' : isLight ? '#cbd5e1' : '#334155', backgroundColor: showSelectedOnly ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)') : 'transparent' }
                    ]}
                    onPress={() => setShowSelectedOnly(!showSelectedOnly)}
                  >
                    <Ionicons name={showSelectedOnly ? "checkbox" : "square-outline"} size={14} color={showSelectedOnly ? "#10b981" : subTextColor} />
                    <Text style={[styles.selectedOnlyText, { color: showSelectedOnly ? '#10b981' : textColor }]}>
                      Selected ({form.specializedCrops?.length ?? 0})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Category Horizontal Filter Strip */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterScroll}>
                  <TouchableOpacity
                    style={[
                      styles.categoryFilterChip,
                      selectedCropCategory === 'all' && styles.categoryFilterChipActive,
                      { backgroundColor: selectedCropCategory === 'all' ? '#10b981' : isLight ? '#f1f5f9' : '#1e293b' }
                    ]}
                    onPress={() => setSelectedCropCategory('all')}
                  >
                    <Text style={[styles.categoryFilterChipText, selectedCropCategory === 'all' && { color: '#ffffff' }]}>
                      All Categories ({masterSystemCrops.length})
                    </Text>
                  </TouchableOpacity>
                  {CROP_CATEGORIES.map((cat) => {
                    const count = masterSystemCrops.filter((c) => c.categoryId === cat.id).length;
                    if (count === 0) return null;
                    const isActive = selectedCropCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryFilterChip,
                          isActive && styles.categoryFilterChipActive,
                          { backgroundColor: isActive ? '#10b981' : isLight ? '#f1f5f9' : '#1e293b' }
                        ]}
                        onPress={() => setSelectedCropCategory(cat.id)}
                      >
                        <Text style={[styles.categoryFilterChipText, isActive && { color: '#ffffff' }]}>
                          {cat.name} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Active Filter Summary Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor }}>
                    Showing {filteredSystemCrops.length} of {masterSystemCrops.length} Crops:
                  </Text>
                </View>

                {/* Crops Grid */}
                <View style={[styles.cropChipsRow, { maxHeight: 300 }]}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 6 }}>
                    {filteredSystemCrops.map((crop) => {
                      const isSelected = (form.specializedCrops || []).includes(crop.name);
                      return (
                        <TouchableOpacity
                          key={crop.name}
                          style={[
                            styles.cropChip,
                            {
                              backgroundColor: isSelected
                                ? 'rgba(16, 185, 129, 0.18)'
                                : isLight
                                  ? '#f1f5f9'
                                  : 'rgba(255, 255, 255, 0.05)',
                              borderColor: isSelected ? '#10b981' : isLight ? '#cbd5e1' : '#334155',
                            },
                          ]}
                          onPress={() => handleCropToggle(crop.name)}
                        >
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                            size={13}
                            color={isSelected ? '#10b981' : subTextColor}
                          />
                          <Text
                            style={[
                              styles.cropChipText,
                              { color: isSelected ? '#10b981' : textColor },
                            ]}
                          >
                            {crop.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Custom Crop Add Field */}
            {!form.allCropsSelected && (
              <View style={styles.customCropRow}>
                <TextInput
                  style={[styles.customCropInput, { color: textColor, borderColor: isLight ? '#cbd5e1' : '#334155' }]}
                  placeholder="Add another crop (e.g. Kinnow, Dragon Fruit)..."
                  placeholderTextColor={subTextColor}
                  value={customCropInput}
                  onChangeText={setCustomCropInput}
                />
                <TouchableOpacity style={styles.addCropBtn} onPress={handleAddCustomCrop}>
                  <Text style={styles.addCropBtnText}>Add Crop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
        </>
      )}


      {/* Bottom Save Action */}
      <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 30 }}>
        <TouchableOpacity
          style={[styles.bottomSaveBtn, updateMutation.isPending && { opacity: 0.7 }]}
          disabled={updateMutation.isPending}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.bottomSaveBtnText}>Save All Doctor Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cpanelTabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 6,
    marginBottom: 4,
  },
  cpanelTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  cpanelTabBtnActive: {
    ...premiumShadow('#000000', 'sm'),
  },
  cpanelTabBtnText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  certNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 10,
    gap: 12,
  },
  certNavLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certRibbonBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certNavTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  certNavSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  certNavArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  certNavBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#10b981',
  },

  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  mainHeading: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
  },
  mainSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    ...premiumShadow('#10b981', 'sm'),
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successBannerText: {
    color: '#15803d',
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  sectionCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.2,
    gap: 12,
    ...premiumShadow('#000000', 'sm'),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  iconBadgeGreen: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeBlue: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeAmber: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgePurple: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  toggleList: {
    gap: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toggleTitle: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  toggleDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 2,
    lineHeight: 15,
  },
  privacyTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  privacyTagText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  planBox: {
    flex: 1,
    minWidth: 240,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  planBoxTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  planDurationBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  planDurationText: {
    color: '#3b82f6',
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  inputGroup: {
    gap: 3,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
  },
  priceInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  quotaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quotaLabel: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  cropActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  cropActionBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  cropSearchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  cropSearchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  cropSearchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    padding: 0,
  },
  selectedOnlyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectedOnlyToggleBtnActive: {
    borderColor: '#10b981',
  },
  selectedOnlyText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  categoryFilterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  categoryFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  categoryFilterChipActive: {
    borderColor: '#10b981',
  },
  categoryFilterChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  cropChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  cropChipText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
  },
  customCropRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  customCropInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  addCropBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addCropBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1.2,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  timingRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  multilineInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    minHeight: 54,
  },
  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: RADIUS.pill,
    ...premiumShadow('#10b981', 'md'),
  },
  bottomSaveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
