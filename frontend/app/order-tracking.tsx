import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import { apiClient } from '@/src/api/client';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();

  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');
  const [searchInput, setSearchInput] = useState(params.orderId || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (params.orderId) {
      setSearchInput(params.orderId);
      handleTrackOrder(params.orderId);
    }
  }, [params.orderId]);

  const handleTrackOrder = async (queryId?: string) => {
    const idToSearch = (queryId || searchInput).trim();
    if (!idToSearch) {
      setErrorMessage('Please enter a valid Order ID or Phone Number.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await apiClient.get(`/orders/${idToSearch}`);
      if (res?.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
        setErrorMessage(`No order found matching "${idToSearch}". Please verify your Order ID.`);
      }
    } catch (err: any) {
      setOrder(null);
      setErrorMessage(
        err?.response?.data?.message ||
        `No shipment found for ID "${idToSearch}". Please check the Order ID sent via SMS/WhatsApp.`
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepName: string) => {
    if (!order) return 'PENDING';
    const status = (order.status || '').toUpperCase();

    if (stepName === 'PLACED') return 'COMPLETED';
    if (stepName === 'CONFIRMED' && ['CONFIRMED', 'PACKING', 'PACKED', 'DISPATCHED', 'DELIVERED'].includes(status))
      return 'COMPLETED';
    if (stepName === 'DISPATCHED' && ['DISPATCHED', 'DELIVERED'].includes(status)) return 'COMPLETED';
    if (stepName === 'DELIVERED' && status === 'DELIVERED') return 'COMPLETED';

    return 'PENDING';
  };

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      {/* Subtle Ambient Glowing Orbs */}
      <View style={isDay ? styles.glowOrbMintDay : styles.glowOrbMintNight} />
      <View style={isDay ? styles.glowOrbBlueDay : styles.glowOrbBlueNight} />

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

          {/* Hero Header Card */}
          <View style={[styles.heroCard, isDay ? styles.heroCardDay : styles.heroCardNight]}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.trackBadge, isDay ? styles.trackBadgeDay : styles.trackBadgeNight]}>
                <Ionicons name="navigate" size={13} color={isDay ? '#059669' : '#34d399'} />
                <Text style={[styles.trackBadgeText, isDay ? styles.trackBadgeTextDay : styles.trackBadgeTextNight]}>
                  SHIPROCKET LIVE COURIER DISPATCH
                </Text>
              </View>
              <View style={[styles.speedBadge, isDay ? styles.speedBadgeDay : styles.speedBadgeNight]}>
                <Ionicons name="flash" size={12} color={isDay ? '#d97706' : '#fde68a'} />
                <Text style={[styles.speedBadgeText, isDay ? styles.speedBadgeTextDay : styles.speedBadgeTextNight]}>
                  REAL-TIME APMC &amp; STORE LOGISTICS
                </Text>
              </View>
            </View>

            <Text style={[styles.heroTitle, isDay ? styles.heroTitleDay : styles.heroTitleNight]}>
              Track Your Consignment
            </Text>
            <Text style={[styles.heroSub, isDay ? styles.heroSubDay : styles.heroSubNight]}>
              Enter your Order Number or AWB Tracking Code to check live package location and dispatch timeline.
            </Text>

            {/* Interactive Search Box */}
            <View style={[styles.searchBox, isDay ? styles.searchBoxDay : styles.searchBoxNight]}>
              <Ionicons name="search" size={18} color={isDay ? '#059669' : '#34d399'} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, isDay ? styles.searchInputDay : styles.searchInputNight]}
                placeholder="Enter Order ID (e.g. FK-49021) or Tracking Code..."
                placeholderTextColor={isDay ? '#94a3b8' : '#64748b'}
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={() => handleTrackOrder()}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.trackButton}
                onPress={() => handleTrackOrder()}
                activeOpacity={0.88}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={14} color="#ffffff" />
                    <Text style={styles.trackButtonText}>Track Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>

          {/* Active Order Details & Timeline */}
          {order ? (
            <View style={[styles.orderCard, isDay ? styles.orderCardDay : styles.orderCardNight]}>
              {/* Order Brief Strip */}
              <View style={styles.orderHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderNum, isDay ? styles.orderNumDay : styles.orderNumNight]}>
                    Order #{order.orderNumber || order.id?.slice(-8)}
                  </Text>
                  <Text style={[styles.orderDate, isDay ? styles.orderDateDay : styles.orderDateNight]}>
                    Placed on: {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : 'Recent'}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.statusPillText}>{(order.status || 'CONFIRMED').toUpperCase()}</Text>
                </View>
              </View>

              {/* Courier Partner Info */}
              <View style={[styles.courierBanner, isDay ? styles.courierBannerDay : styles.courierBannerNight]}>
                <View style={styles.courierIconWrap}>
                  <FontAwesome5 name="shipping-fast" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courierPartnerTitle, isDay ? styles.courierTitleDay : styles.courierTitleNight]}>
                    Delivery Partner: {order.courierName || 'Shiprocket Express Priority'}
                  </Text>
                  <Text style={[styles.courierAwb, isDay ? styles.courierAwbDay : styles.courierAwbNight]}>
                    AWB Tracking Code: <Text style={{ fontFamily: FONT.bold }}>{order.trackingId || 'Assigned upon seller dispatch'}</Text>
                  </Text>
                </View>
              </View>

              {/* 4-Step Timeline Progress */}
              <Text style={[styles.timelineHeader, isDay ? styles.timelineHeaderDay : styles.timelineHeaderNight]}>
                📍 Real-Time Dispatch &amp; Transit Milestones
              </Text>

              <View style={styles.timelineList}>
                {[
                  { name: 'PLACED', title: 'Order Placed & Payment Verified', desc: 'Seller notified for consignment packing' },
                  { name: 'CONFIRMED', title: 'Consignment Packed & Ready', desc: 'Shiprocket courier partner allocated' },
                  { name: 'DISPATCHED', title: 'In Transit / Local Hub Dispatched', desc: 'On the way to your farm address' },
                  { name: 'DELIVERED', title: 'Successfully Delivered', desc: 'Package handed over to customer' },
                ].map((step, idx) => {
                  const stepState = getStepStatus(step.name);
                  const isDone = stepState === 'COMPLETED';

                  return (
                    <View key={step.name} style={styles.timelineItem}>
                      <View style={styles.timelineLeftCol}>
                        <View
                          style={[
                            styles.timelineDot,
                            isDone ? styles.timelineDotDone : (isDay ? styles.timelineDotPendingDay : styles.timelineDotPendingNight),
                          ]}
                        >
                          <Ionicons
                            name={isDone ? 'checkmark' : 'time-outline'}
                            size={13}
                            color="#ffffff"
                          />
                        </View>
                        {idx < 3 && (
                          <View
                            style={[
                              styles.timelineBar,
                              isDone ? styles.timelineBarDone : (isDay ? styles.timelineBarPendingDay : styles.timelineBarPendingNight),
                            ]}
                          />
                        )}
                      </View>

                      <View style={styles.timelineRightCol}>
                        <Text style={[styles.stepTitle, isDone && styles.stepTitleDone, isDay ? styles.stepTitleDay : styles.stepTitleNight]}>
                          {step.title}
                        </Text>
                        <Text style={[styles.stepDesc, isDay ? styles.stepDescDay : styles.stepDescNight]}>
                          {step.desc}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : !hasSearched ? (
            /* Guide Card when user first visits */
            <View style={[styles.guideCard, isDay ? styles.guideCardDay : styles.guideCardNight]}>
              <View style={styles.guideHeader}>
                <Ionicons name="information-circle" size={20} color="#059669" />
                <Text style={[styles.guideTitle, isDay ? styles.guideTitleDay : styles.guideTitleNight]}>
                  How to Find Your Order Information
                </Text>
              </View>
              <Text style={[styles.guideText, isDay ? styles.guideTextDay : styles.guideTextNight]}>
                • <Text style={{ fontFamily: FONT.bold }}>SMS Confirmation:</Text> Check the dispatch SMS sent to your registered mobile from "FARMSKING".
              </Text>
              <Text style={[styles.guideText, isDay ? styles.guideTextDay : styles.guideTextNight, { marginTop: 6 }]}>
                • <Text style={{ fontFamily: FONT.bold }}>WhatsApp Alerts:</Text> Real-time tracking links are automatically sent to your WhatsApp number upon courier pickup.
              </Text>
              <Text style={[styles.guideText, isDay ? styles.guideTextDay : styles.guideTextNight, { marginTop: 6 }]}>
                • <Text style={{ fontFamily: FONT.bold }}>Customer Helpline:</Text> If you cannot locate your Order ID, call our 24/7 helpline at <Text style={{ fontFamily: FONT.extraBold }}>95776-22000</Text>.
              </Text>
            </View>
          ) : null}

          {/* Direct Support Strip */}
          <View style={[styles.supportStrip, isDay ? styles.supportStripDay : styles.supportStripNight]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportStripTitle}>Need Assistance with Delivery or Consignment?</Text>
              <Text style={styles.supportStripSub}>Our customer logistics desk is available 24/7 to resolve delays.</Text>
            </View>
            <View style={styles.supportActions}>
              <TouchableOpacity
                style={styles.supportCallBtn}
                onPress={() => Linking.openURL('tel:9577622000')}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={13} color="#064e3b" />
                <Text style={styles.supportCallBtnText}>Call 9577622000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.supportWhatsAppBtn}
                onPress={() => Linking.openURL('https://wa.me/919577622000?text=Hello%20FarmsKing%2C%20I%20need%20help%20tracking%20my%20order')}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={13} color="#ffffff" />
                <Text style={styles.supportWhatsAppBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
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

  glowOrbMintDay: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(167, 243, 208, 0.28)',
    top: 40,
    left: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbMintNight: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    top: 40,
    left: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbBlueDay: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(186, 230, 253, 0.22)',
    bottom: 60,
    right: -80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbBlueNight: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    bottom: 60,
    right: -80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },

  scrollContent: { paddingBottom: 60, paddingTop: 90 },
  container: { width: '100%', maxWidth: 840, alignSelf: 'center', paddingHorizontal: 16 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontFamily: FONT.bold },
  backTextDay: { color: '#059669' },
  backTextNight: { color: '#34d399' },

  // Hero Card
  heroCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    ...premiumShadow('rgba(0,0,0,0.05)', 'sm'),
  },
  heroCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  heroCardNight: { backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' },

  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  trackBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1 },
  trackBadgeDay: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  trackBadgeNight: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(52,211,153,0.3)' },
  trackBadgeText: { fontSize: 10.5, fontFamily: FONT.extraBold, letterSpacing: 0.4 },
  trackBadgeTextDay: { color: '#047857' },
  trackBadgeTextNight: { color: '#34d399' },

  speedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1 },
  speedBadgeDay: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  speedBadgeNight: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(251,191,36,0.3)' },
  speedBadgeText: { fontSize: 10.5, fontFamily: FONT.bold },
  speedBadgeTextDay: { color: '#b45309' },
  speedBadgeTextNight: { color: '#fde68a' },

  heroTitle: { fontSize: 26, fontFamily: FONT.extraBold, marginBottom: 6 },
  heroTitleDay: { color: '#0f172a' },
  heroTitleNight: { color: '#ffffff' },
  heroSub: { fontSize: 13.5, fontFamily: FONT.medium, lineHeight: 20, marginBottom: 18 },
  heroSubDay: { color: '#475569' },
  heroSubNight: { color: '#cbd5e1' },

  // Search Box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingLeft: 12,
    paddingRight: 6,
    height: 50,
  },
  searchBoxDay: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  searchBoxNight: { backgroundColor: '#111e19', borderColor: 'rgba(16,185,129,0.3)' },

  searchInput: { flex: 1, fontSize: 14, fontFamily: FONT.medium },
  searchInputDay: { color: '#0f172a' },
  searchInputNight: { color: '#ffffff' },

  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  trackButtonText: { color: '#ffffff', fontSize: 13, fontFamily: FONT.bold },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBannerText: { color: '#b91c1c', fontSize: 12.5, fontFamily: FONT.medium, flex: 1 },

  // Order Details Card
  orderCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    ...premiumShadow('rgba(0,0,0,0.06)', 'sm'),
  },
  orderCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  orderCardNight: { backgroundColor: '#111e19', borderColor: 'rgba(16,185,129,0.2)' },

  orderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  orderNum: { fontSize: 18, fontFamily: FONT.extraBold },
  orderNumDay: { color: '#0f172a' },
  orderNumNight: { color: '#ffffff' },
  orderDate: { fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  orderDateDay: { color: '#64748b' },
  orderDateNight: { color: '#94a3b8' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  statusPillText: { fontSize: 11, fontFamily: FONT.extraBold, color: '#065f46', letterSpacing: 0.5 },

  courierBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  courierBannerDay: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  courierBannerNight: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(52,211,153,0.25)' },
  courierIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  courierPartnerTitle: { fontSize: 13.5, fontFamily: FONT.bold },
  courierTitleDay: { color: '#065f46' },
  courierTitleNight: { color: '#a7f3d0' },
  courierAwb: { fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  courierAwbDay: { color: '#047857' },
  courierAwbNight: { color: '#34d399' },

  timelineHeader: { fontSize: 14.5, fontFamily: FONT.extraBold, marginBottom: 16 },
  timelineHeaderDay: { color: '#0f172a' },
  timelineHeaderNight: { color: '#ffffff' },

  timelineList: { paddingLeft: 6 },
  timelineItem: { flexDirection: 'row', minHeight: 64 },
  timelineLeftCol: { alignItems: 'center', width: 28, marginRight: 12 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineDotDone: { backgroundColor: '#059669' },
  timelineDotPendingDay: { backgroundColor: '#cbd5e1' },
  timelineDotPendingNight: { backgroundColor: '#334155' },
  timelineBar: { width: 2, flex: 1, marginVertical: 2 },
  timelineBarDone: { backgroundColor: '#059669' },
  timelineBarPendingDay: { backgroundColor: '#e2e8f0' },
  timelineBarPendingNight: { backgroundColor: '#1e293b' },

  timelineRightCol: { flex: 1, paddingBottom: 16 },
  stepTitle: { fontSize: 14, fontFamily: FONT.bold },
  stepTitleDay: { color: '#334155' },
  stepTitleNight: { color: '#94a3b8' },
  stepTitleDone: { color: '#059669' },
  stepDesc: { fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  stepDescDay: { color: '#64748b' },
  stepDescNight: { color: '#64748b' },

  // Guide Card
  guideCard: {
    padding: 22,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
  },
  guideCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  guideCardNight: { backgroundColor: '#111e19', borderColor: 'rgba(255,255,255,0.08)' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  guideTitle: { fontSize: 15, fontFamily: FONT.bold },
  guideTitleDay: { color: '#0f172a' },
  guideTitleNight: { color: '#ffffff' },
  guideText: { fontSize: 13, fontFamily: FONT.medium, lineHeight: 19 },
  guideTextDay: { color: '#475569' },
  guideTextNight: { color: '#cbd5e1' },

  // Support Strip
  supportStrip: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    ...premiumShadow('rgba(16,185,129,0.15)', 'sm'),
  },
  supportStripDay: { backgroundColor: '#064e3b', borderColor: '#047857' },
  supportStripNight: { backgroundColor: '#042f2e', borderColor: '#065f46' },
  supportStripTitle: { fontSize: 14.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  supportStripSub: { fontSize: 12, fontFamily: FONT.medium, color: '#a7f3d0', marginTop: 2 },

  supportActions: { flexDirection: 'row', gap: 8 },
  supportCallBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#a7f3d0', paddingHorizontal: 13, paddingVertical: 8, borderRadius: RADIUS.pill },
  supportCallBtnText: { color: '#064e3b', fontSize: 12, fontFamily: FONT.bold },
  supportWhatsAppBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#16a34a', paddingHorizontal: 13, paddingVertical: 8, borderRadius: RADIUS.pill },
  supportWhatsAppBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
});
