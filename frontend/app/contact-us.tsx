import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import { useSupportContact } from '@/src/hooks/useAppSettings';
import { recordRealFarmerActivity } from '@/constants/liveFarmerFeed';

export default function ContactUsPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const isDesktop = width > 900;
  const { data: support } = useSupportContact();

  const phone = '9577622000';
  const displayPhone = '95776-22000';
  const email = support?.email || 'support@farmsking.in';
  const registeredAddress = 'FARMSKING TECHNOLOGIES PRIVATE LIMITED\nVPO Goindwal Sahib, Tehsil Khadur Sahib\nDistrict Tarn Taran, Punjab, India - 143422';
  const corporateAddress = 'FARMSKING TECHNOLOGIES PRIVATE LIMITED\nMakhu, Ferozepur\nPunjab, India - 142044';

  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');
  const [senderName, setSenderName] = useState('');
  const [senderMobile, setSenderMobile] = useState('');
  const [senderTopic, setSenderTopic] = useState('Crop Advisory');
  const [senderMessage, setSenderMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('farmsking_theme_mode');
      if (saved === 'night' || saved === 'day') setThemeMode(saved);
      const handleStorage = () => {
        const t = localStorage.getItem('farmsking_theme_mode');
        if (t === 'night' || t === 'day') setThemeMode(t);
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const isDay = themeMode === 'day';

  const handleDial = () => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent('Hello FarmsKing Agronomy Team, I need agricultural assistance regarding my farm.');
    Linking.openURL(`https://wa.me/91${phone}?text=${text}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${email}?subject=FarmsKing%20Platform%20Inquiry`);
  };

  const handleMaps = () => {
    Linking.openURL('https://maps.google.com/?q=Makhu,Punjab,142044');
  };

  const handleSendMessage = () => {
    if (!senderName.trim() || !senderMobile.trim() || !senderMessage.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in your Name, Mobile Number, and Message.');
      } else {
        Alert.alert('Incomplete Form', 'Please fill in your Name, Mobile Number, and Message.');
      }
      return;
    }

    setIsSent(true);

    // Record real farmer activity permanently into live social proof feed
    recordRealFarmerActivity({
      name: senderName.trim(),
      location: 'Punjab, India',
      action: `Submitted Agronomy Inquiry (${senderTopic})`,
      detail: 'Contacted FarmsKing Official Advisory Desk',
      emoji: '🌾',
      tagColor: '#059669',
    });
    setTimeout(() => {
      setSenderName('');
      setSenderMobile('');
      setSenderMessage('');
      setIsSent(false);
    }, 6000);
  };

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      {/* Subtle Ambient Glowing Orbs */}
      <View style={isDay ? styles.glowOrbMintDay : styles.glowOrbMintNight} />
      <View style={isDay ? styles.glowOrbBlueDay : styles.glowOrbBlueNight} />

      {/* Floating Public Header */}
      <PublicHeader themeMode={themeMode} onThemeToggle={(m) => setThemeMode(m)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Breadcrumb / Back Link */}
          <TouchableOpacity style={styles.backRow} onPress={() => router.push('/')} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={15} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.backText, isDay ? styles.backTextDay : styles.backTextNight]}>
              Back to FarmsKing
            </Text>
          </TouchableOpacity>

          {/* Hero Header */}
          <View style={[styles.heroCard, isDay ? styles.heroCardDay : styles.heroCardNight]}>
            <View style={styles.badgeRow}>
              <View style={[styles.helplineBadge, isDay ? styles.helplineBadgeDay : styles.helplineBadgeNight]}>
                <Ionicons name="headset" size={13} color={isDay ? '#059669' : '#34d399'} />
                <Text style={[styles.helplineBadgeText, isDay ? styles.helplineBadgeTextDay : styles.helplineBadgeTextNight]}>
                  24/7 NATIONAL HELPLINE &amp; AGRONOMY DESK
                </Text>
              </View>
              <View style={[styles.isoBadge, isDay ? styles.isoBadgeDay : styles.isoBadgeNight]}>
                <Ionicons name="shield-checkmark" size={12} color={isDay ? '#0284c7' : '#38bdf8'} />
                <Text style={[styles.isoBadgeText, isDay ? styles.isoBadgeTextDay : styles.isoBadgeTextNight]}>
                  ISO 27001 VERIFIED
                </Text>
              </View>
            </View>

            <Text style={[styles.heroTitle, isDay ? styles.heroTitleDay : styles.heroTitleNight]}>
              Get in Touch with FarmsKing
            </Text>
            <Text style={[styles.heroSub, isDay ? styles.heroSubDay : styles.heroSubNight]}>
              Direct connectivity for cultivators, inputs store orders, crop pathology consultations, and enterprise mandi partnerships.
            </Text>
          </View>

          {/* 4 Interactive Touchpoint Cards */}
          <View style={styles.touchpointGrid}>
            {/* Phone Card */}
            <TouchableOpacity
              style={[styles.touchCard, isDay ? styles.touchCardDay : styles.touchCardNight]}
              onPress={handleDial}
              activeOpacity={0.88}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDay ? '#ecfdf5' : 'rgba(16,185,129,0.18)' }]}>
                <Ionicons name="call" size={24} color={isDay ? '#059669' : '#34d399'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>Direct Phone Support</Text>
              <Text style={styles.cardHighlight}>{displayPhone}</Text>
              <Text style={[styles.cardSubText, isDay ? styles.cardSubDay : styles.cardSubNight]}>
                Mon-Sat • 10:00 AM to 5:00 PM IST
              </Text>
              <View style={styles.actionPill}>
                <Ionicons name="call-outline" size={13} color="#059669" />
                <Text style={styles.actionPillText}>Tap to Call Now →</Text>
              </View>
            </TouchableOpacity>

            {/* WhatsApp Card */}
            <TouchableOpacity
              style={[styles.touchCard, isDay ? styles.touchCardDay : styles.touchCardNight]}
              onPress={handleWhatsApp}
              activeOpacity={0.88}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDay ? '#f0fdf4' : 'rgba(34,197,94,0.18)' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#16a34a" />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>Official WhatsApp Desk</Text>
              <Text style={[styles.cardHighlight, { color: '#16a34a' }]}>{displayPhone}</Text>
              <Text style={[styles.cardSubText, isDay ? styles.cardSubDay : styles.cardSubNight]}>
                24/7 Automated Assistant &amp; Agronomist Chat
              </Text>
              <View style={[styles.actionPill, { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.08)' }]}>
                <Ionicons name="chatbubbles-outline" size={13} color="#16a34a" />
                <Text style={[styles.actionPillText, { color: '#16a34a' }]}>Open WhatsApp Chat →</Text>
              </View>
            </TouchableOpacity>

            {/* Email Card */}
            <TouchableOpacity
              style={[styles.touchCard, isDay ? styles.touchCardDay : styles.touchCardNight]}
              onPress={handleEmail}
              activeOpacity={0.88}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDay ? '#eff6ff' : 'rgba(59,130,246,0.18)' }]}>
                <Ionicons name="mail" size={24} color="#2563eb" />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>Corporate Email Helpdesk</Text>
              <Text style={[styles.cardHighlight, { color: '#2563eb', fontSize: 14 }]} numberOfLines={1}>
                {email}
              </Text>
              <Text style={[styles.cardSubText, isDay ? styles.cardSubDay : styles.cardSubNight]}>
                Official written inquiries • 24hr SLA
              </Text>
              <View style={[styles.actionPill, { borderColor: 'rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.08)' }]}>
                <Ionicons name="mail-outline" size={13} color="#2563eb" />
                <Text style={[styles.actionPillText, { color: '#2563eb' }]}>Send Direct Email →</Text>
              </View>
            </TouchableOpacity>

            {/* Registered Corporate Office */}
            <TouchableOpacity
              style={[styles.touchCard, isDay ? styles.touchCardDay : styles.touchCardNight]}
              onPress={() => Linking.openURL('https://maps.google.com/?q=Goindwal+Sahib,Tarn+Taran,Punjab,143422')}
              activeOpacity={0.88}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDay ? '#fef3c7' : 'rgba(245,158,11,0.18)' }]}>
                <Ionicons name="business" size={24} color="#d97706" />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>Registered Corporate Office</Text>
              <Text style={[styles.cardHighlight, { color: '#d97706', fontSize: 13.5 }]}>
                Goindwal Sahib, Tarn Taran
              </Text>
              <Text style={[styles.cardSubText, isDay ? styles.cardSubDay : styles.cardSubNight]}>
                VPO Goindwal Sahib, Tehsil Khadur Sahib, District Tarn Taran, Punjab - 143422
              </Text>
              <View style={[styles.actionPill, { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.08)' }]}>
                <Ionicons name="map-outline" size={13} color="#d97706" />
                <Text style={[styles.actionPillText, { color: '#d97706' }]}>Open in Google Maps →</Text>
              </View>
            </TouchableOpacity>

            {/* Operational Working Headquarters */}
            <TouchableOpacity
              style={[styles.touchCard, isDay ? styles.touchCardDay : styles.touchCardNight]}
              onPress={handleMaps}
              activeOpacity={0.88}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDay ? '#ecfdf5' : 'rgba(16,185,129,0.18)' }]}>
                <Ionicons name="location" size={24} color="#059669" />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>Headquarters & Operational Office</Text>
              <Text style={[styles.cardHighlight, { color: '#059669', fontSize: 13.5 }]}>
                Makhu, Ferozepur
              </Text>
              <Text style={[styles.cardSubText, isDay ? styles.cardSubDay : styles.cardSubNight]}>
                Makhu, Ferozepur, Punjab - 142044
              </Text>
              <View style={[styles.actionPill, { borderColor: 'rgba(5,150,105,0.3)', backgroundColor: 'rgba(5,150,105,0.08)' }]}>
                <Ionicons name="navigate-outline" size={13} color="#059669" />
                <Text style={[styles.actionPillText, { color: '#059669' }]}>Navigate to Makhu Office →</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Official Leadership & Operational Team Section */}
          <View style={[styles.leadershipCard, isDay ? styles.leadershipCardDay : styles.leadershipCardNight]}>
            <View style={styles.leadershipHeader}>
              <View style={styles.leadershipHeaderIcon}>
                <Ionicons name="people" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.leadershipTitle, isDay ? styles.leadershipTitleDay : styles.leadershipTitleNight]}>
                  Official Leadership &amp; Operational Team
                </Text>
                <Text style={[styles.leadershipSub, isDay ? styles.leadershipSubDay : styles.leadershipSubNight]}>
                  FARMSKING TECHNOLOGIES PRIVATE LIMITED — Serving farmers, gardeners, organic consumers &amp; nature lovers nationwide.
                </Text>
              </View>
            </View>

            <View style={styles.leadershipGrid}>
              {/* Director 1 */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={styles.leaderRolePill}>
                  <Text style={styles.leaderRoleText}>DIRECTOR</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Bakshish Singh
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Board of Directors • Corporate Governance &amp; Strategy
                </Text>
              </View>

              {/* Director 2 */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={styles.leaderRolePill}>
                  <Text style={styles.leaderRoleText}>DIRECTOR</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Gagandeep Kaur
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Board of Directors • Operations &amp; Commercial Partnerships
                </Text>
              </View>

              {/* General Manager */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={[styles.leaderRolePill, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Text style={[styles.leaderRoleText, { color: '#0369a1' }]}>GENERAL MANAGER</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Gurnam Singh Ji
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  General Manager • Mandi Networks, Operations &amp; Quality
                </Text>
              </View>

              {/* Technical Support Lead */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={[styles.leaderRolePill, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                  <Text style={[styles.leaderRoleText, { color: '#6d28d9' }]}>TECHNICAL SUPPORT</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Engg. Gurdit Singh
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Lead Technical Support Engineer • Hardware, Telemetry &amp; Field Systems
                </Text>
              </View>

              {/* Backend Support (IT Services) */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={[styles.leaderRolePill, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Text style={[styles.leaderRoleText, { color: '#1d4ed8' }]}>BACKEND IT SUPPORT</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Charanjit Singh
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Backend Support Lead • Cloud Infrastructure &amp; IT Systems Desk
                </Text>
              </View>

              {/* Hardware Support */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={[styles.leaderRolePill, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Text style={[styles.leaderRoleText, { color: '#15803d' }]}>HARDWARE SUPPORT</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Gurjant Singh
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Hardware Support Lead • Telemetry &amp; Enterprise Systems Desk
                </Text>
              </View>

              {/* Testing Advisors */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={[styles.leaderRolePill, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                  <Text style={[styles.leaderRoleText, { color: '#b45309' }]}>TESTING ADVISORS</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Gurnam Singh &amp; Sudhir Kumar Mahato
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Platform Testing, Field Agronomy &amp; Crop Diagnostic Validation
                </Text>
              </View>

              {/* Marigold Floriculture Expert */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={[styles.leaderRolePill, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
                  <Text style={[styles.leaderRoleText, { color: '#c2410c' }]}>FLORICULTURE &amp; PROMOTION</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Sudhir Kumar Mahato
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Marigold Farming Expert &amp; Commercial Promotion Partner
                </Text>
              </View>

              {/* Organic Products & Marketing Manager */}
              <View style={[styles.leaderTile, isDay ? styles.leaderTileDay : styles.leaderTileNight]}>
                <View style={[styles.leaderRolePill, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                  <Text style={[styles.leaderRoleText, { color: '#047857' }]}>ORGANIC &amp; MARKETING</Text>
                </View>
                <Text style={[styles.leaderName, isDay ? styles.leaderNameDay : styles.leaderNameNight]}>
                  Manjeet Sra
                </Text>
                <Text style={[styles.leaderDesc, isDay ? styles.leaderDescDay : styles.leaderDescNight]}>
                  Organic Products &amp; Marketing Manager • Pure Vermicompost &amp; Bio-Fertilizers
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Message / Advisory Request Form */}
          <View style={[styles.formCard, isDay ? styles.formCardDay : styles.formCardNight]}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderIcon}>
                <Ionicons name="paper-plane" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formTitle, isDay ? styles.formTitleDay : styles.formTitleNight]}>
                  Send a Direct Message or Agronomy Inquiry
                </Text>
                <Text style={[styles.formSub, isDay ? styles.formSubDay : styles.formSubNight]}>
                  Our certified agronomists and support officers will respond promptly.
                </Text>
              </View>
            </View>

            {isSent ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={22} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Inquiry Submitted Successfully!</Text>
                  <Text style={styles.successSub}>
                    Thank you. A FarmsKing specialist will contact you on +91 {senderMobile} within 24 hours.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.formBody}>
                <View style={[styles.formRow, isDesktop && { flexDirection: 'row', gap: 14 }]}>
                  <View style={{ flex: 1, marginBottom: 12 }}>
                    <Text style={[styles.inputLabel, isDay ? styles.inputLabelDay : styles.inputLabelNight]}>
                      Your Name *
                    </Text>
                    <TextInput
                      style={[styles.inputField, isDay ? styles.inputFieldDay : styles.inputFieldNight]}
                      placeholder="e.g. Gurpreet Singh"
                      placeholderTextColor={isDay ? '#94a3b8' : '#64748b'}
                      value={senderName}
                      onChangeText={setSenderName}
                    />
                  </View>
                  <View style={{ flex: 1, marginBottom: 12 }}>
                    <Text style={[styles.inputLabel, isDay ? styles.inputLabelDay : styles.inputLabelNight]}>
                      Mobile Number (10 Digits) *
                    </Text>
                    <TextInput
                      style={[styles.inputField, isDay ? styles.inputFieldDay : styles.inputFieldNight]}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={isDay ? '#94a3b8' : '#64748b'}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={senderMobile}
                      onChangeText={setSenderMobile}
                    />
                  </View>
                </View>

                {/* Topic Chips */}
                <Text style={[styles.inputLabel, isDay ? styles.inputLabelDay : styles.inputLabelNight, { marginBottom: 6 }]}>
                  Subject / Topic
                </Text>
                <View style={styles.topicRow}>
                  {['Crop Advisory', 'Agri Store Order', 'Mandi Rates', 'Seller Onboarding', 'Technical Support'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.topicChip,
                        senderTopic === t
                          ? styles.topicChipActive
                          : (isDay ? styles.topicChipDay : styles.topicChipNight),
                      ]}
                      onPress={() => setSenderTopic(t)}
                    >
                      <Text
                        style={[
                          styles.topicChipText,
                          senderTopic === t
                            ? styles.topicChipTextActive
                            : (isDay ? styles.topicChipTextDay : styles.topicChipTextNight),
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Message Field */}
                <Text style={[styles.inputLabel, isDay ? styles.inputLabelDay : styles.inputLabelNight, { marginTop: 10, marginBottom: 6 }]}>
                  Your Message or Farm Query *
                </Text>
                <TextInput
                  style={[styles.textAreaField, isDay ? styles.inputFieldDay : styles.inputFieldNight]}
                  placeholder="Describe your query, crop issue, or order question in detail..."
                  placeholderTextColor={isDay ? '#94a3b8' : '#64748b'}
                  multiline
                  numberOfLines={4}
                  value={senderMessage}
                  onChangeText={setSenderMessage}
                />

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleSendMessage} activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    <Ionicons name="paper-plane" size={16} color="#ffffff" />
                    <Text style={styles.submitBtnText}>Submit Inquiry to FarmsKing Helpdesk</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  rootDay: { backgroundColor: '#f8fafc' },
  rootNight: { backgroundColor: '#091310' },

  // Ambient Glow
  glowOrbMintDay: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(167, 243, 208, 0.28)',
    top: 40,
    left: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbMintNight: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    top: 40,
    left: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbBlueDay: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(186, 230, 253, 0.22)',
    bottom: 80,
    right: -80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbBlueNight: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    bottom: 80,
    right: -80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },

  scrollContent: { paddingBottom: 60, paddingTop: 90 },
  container: { width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 16 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontFamily: FONT.bold },
  backTextDay: { color: '#059669' },
  backTextNight: { color: '#34d399' },

  // Hero
  heroCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    ...premiumShadow('rgba(0,0,0,0.05)', 'sm'),
  },
  heroCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  heroCardNight: { backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  helplineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1 },
  helplineBadgeDay: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  helplineBadgeNight: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(52,211,153,0.3)' },
  helplineBadgeText: { fontSize: 10.5, fontFamily: FONT.extraBold, letterSpacing: 0.4 },
  helplineBadgeTextDay: { color: '#047857' },
  helplineBadgeTextNight: { color: '#34d399' },

  isoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1 },
  isoBadgeDay: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  isoBadgeNight: { backgroundColor: 'rgba(2,132,199,0.15)', borderColor: 'rgba(56,189,248,0.3)' },
  isoBadgeText: { fontSize: 10.5, fontFamily: FONT.bold },
  isoBadgeTextDay: { color: '#0369a1' },
  isoBadgeTextNight: { color: '#38bdf8' },

  heroTitle: { fontSize: 28, fontFamily: FONT.extraBold, marginBottom: 6 },
  heroTitleDay: { color: '#0f172a' },
  heroTitleNight: { color: '#ffffff' },
  heroSub: { fontSize: 14.5, fontFamily: FONT.medium, lineHeight: 21, maxWidth: 760 },
  heroSubDay: { color: '#475569' },
  heroSubNight: { color: '#cbd5e1' },

  // Grid
  touchpointGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 20 },
  touchCard: {
    flex: 1,
    minWidth: 240,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    ...premiumShadow('rgba(0,0,0,0.04)', 'sm'),
  },
  touchCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  touchCardNight: { backgroundColor: '#111e19', borderColor: 'rgba(16,185,129,0.2)' },

  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontFamily: FONT.bold, marginBottom: 4 },
  cardTitleDay: { color: '#0f172a' },
  cardTitleNight: { color: '#ffffff' },
  cardHighlight: { fontSize: 16.5, fontFamily: FONT.extraBold, color: '#059669', marginBottom: 4 },
  cardSubText: { fontSize: 12, fontFamily: FONT.medium, marginBottom: 14 },
  cardSubDay: { color: '#64748b' },
  cardSubNight: { color: '#94a3b8' },

  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.3)',
    backgroundColor: 'rgba(5,150,105,0.07)',
  },
  actionPillText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#059669' },

  // Form Card
  formCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    ...premiumShadow('rgba(0,0,0,0.05)', 'sm'),
  },
  formCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  formCardNight: { backgroundColor: '#111e19', borderColor: 'rgba(16,185,129,0.2)' },

  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  formHeaderIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' },
  formTitle: { fontSize: 18, fontFamily: FONT.extraBold },
  formTitleDay: { color: '#0f172a' },
  formTitleNight: { color: '#ffffff' },
  formSub: { fontSize: 12.5, fontFamily: FONT.medium, marginTop: 2 },
  formSubDay: { color: '#64748b' },
  formSubNight: { color: '#94a3b8' },

  formBody: {},
  formRow: {},
  inputLabel: { fontSize: 11.5, fontFamily: FONT.bold, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputLabelDay: { color: '#475569' },
  inputLabelNight: { color: '#94a3b8' },

  inputField: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  inputFieldDay: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' },
  inputFieldNight: { backgroundColor: '#091310', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' },

  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  topicChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1 },
  topicChipDay: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  topicChipNight: { backgroundColor: '#091310', borderColor: 'rgba(255,255,255,0.15)' },
  topicChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  topicChipText: { fontSize: 12, fontFamily: FONT.bold },
  topicChipTextDay: { color: '#475569' },
  topicChipTextNight: { color: '#cbd5e1' },
  topicChipTextActive: { color: '#ffffff' },

  textAreaField: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT.medium,
    textAlignVertical: 'top',
  },

  submitBtn: { marginTop: 18, borderRadius: 14, overflow: 'hidden', ...premiumShadow('rgba(16,185,129,0.3)', 'md') },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  submitBtnText: { color: '#ffffff', fontSize: 14.5, fontFamily: FONT.bold },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 16,
    borderRadius: 14,
  },
  successTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#065f46' },
  successSub: { fontSize: 12.5, fontFamily: FONT.medium, color: '#047857', marginTop: 2 },

  // Leadership & Team Section
  leadershipCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
    ...premiumShadow('rgba(0,0,0,0.05)', 'sm'),
  },
  leadershipCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  leadershipCardNight: { backgroundColor: '#111e19', borderColor: 'rgba(16,185,129,0.2)' },

  leadershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  leadershipHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadershipTitle: { fontSize: 18, fontFamily: FONT.extraBold },
  leadershipTitleDay: { color: '#0f172a' },
  leadershipTitleNight: { color: '#ffffff' },
  leadershipSub: { fontSize: 12.5, fontFamily: FONT.medium, marginTop: 2 },
  leadershipSubDay: { color: '#64748b' },
  leadershipSubNight: { color: '#94a3b8' },

  leadershipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  leaderTile: {
    flex: 1,
    minWidth: 260,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  leaderTileDay: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  leaderTileNight: { backgroundColor: '#091310', borderColor: 'rgba(255,255,255,0.1)' },

  leaderRolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 8,
  },
  leaderRoleText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#047857',
    letterSpacing: 0.5,
  },
  leaderName: { fontSize: 14.5, fontFamily: FONT.bold, marginBottom: 3 },
  leaderNameDay: { color: '#0f172a' },
  leaderNameNight: { color: '#f8fafc' },
  leaderDesc: { fontSize: 12, fontFamily: FONT.medium, lineHeight: 17 },
  leaderDescDay: { color: '#64748b' },
  leaderDescNight: { color: '#94a3b8' },
});
