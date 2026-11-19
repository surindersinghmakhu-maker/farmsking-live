import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useWidgetSummary } from '../hooks/useMarketRates';
import { useExecutiveTheme } from '../store/theme-context';
import { FONT, RADIUS, premiumShadow } from '../../constants/theme';
import { formatInr } from '../utils/formatInr';

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export const AndroidHomeScreenWidgetPreview: React.FC = () => {
  const router = useRouter();
  const { colors, isDark } = useExecutiveTheme();

  const [unit, setUnit] = useState<'KG' | 'QUINTAL'>('KG');
  const [selectedCrop, setSelectedCrop] = useState<string>('Marigold');
  const [showHowToModal, setShowHowToModal] = useState(false);

  const { data, isLoading, isRefetching, refetch } = useWidgetSummary(selectedCrop, 'Punjab', unit);

  const rates = data?.rates;
  const weather = data?.weather;

  // Multiplier for conversion if displayed in Quintal
  const multiplier = unit === 'QUINTAL' ? 100 : 1;
  const unitLabel = unit === 'QUINTAL' ? '/Qtl' : '/kg';

  const localAvg = rates?.local ? Math.round(rates.local.avgRate * multiplier) : (unit === 'QUINTAL' ? 8330 : 83.3);
  const localMin = rates?.local ? Math.round(rates.local.minRate * multiplier) : (unit === 'QUINTAL' ? 3900 : 39);
  const localMax = rates?.local ? Math.round(rates.local.maxRate * multiplier) : (unit === 'QUINTAL' ? 20000 : 200);
  const localModal = rates?.local ? Math.round(rates.local.modalRate * multiplier) : (unit === 'QUINTAL' ? 6000 : 60);

  const stateAvg = rates?.state ? Math.round(rates.state.avgRate * multiplier) : (unit === 'QUINTAL' ? 8150 : 81.5);
  const nationalAvg = rates?.national ? Math.round(rates.national.avgRate * multiplier) : (unit === 'QUINTAL' ? 8840 : 88.4);

  return (
    <View style={styles.container}>
      {/* Outer Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerIconSquircle}>
            <Ionicons name="phone-portrait-outline" size={16} color="#10b981" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Android Home Screen Widget
              </Text>
              <View style={styles.livePulsePill}>
                <View style={styles.livePulseDot} />
                <Text style={styles.livePulseText}>LIVE 24H</Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>
              Real-time crop rates, mandi telemetry & weather on your phone home screen
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.howToBtn}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setShowHowToModal(true);
          }}
        >
          <Ionicons name="help-circle-outline" size={14} color="#10b981" />
          <Text style={styles.howToBtnText}>How to Add on Phone</Text>
        </TouchableOpacity>
      </View>

      {/* 4x2 Android Widget Card Simulation */}
      <View style={styles.widgetOuterFrame}>
        <LinearGradient
          colors={isDark ? ['#090e17', '#0f172a'] : ['#ffffff', '#f8fafc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.widgetCard,
            {
              borderColor: isDark ? 'rgba(52, 211, 153, 0.45)' : '#cbd5e1',
              shadowColor: '#10b981',
            },
            Platform.OS === 'web' ? ({
              boxShadow: isDark
                ? '0 12px 30px -4px rgba(16, 185, 129, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
                : '0 8px 24px -3px rgba(16, 185, 129, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
            } as any) : {},
          ]}
        >
          {/* Top Bar: Brand, Crop Title & Unit Switcher */}
          <View style={styles.widgetTopBar}>
            <View style={styles.brandRow}>
              <View style={styles.widgetLogoMini}>
                <Ionicons name="leaf" size={13} color="#ffffff" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.cropNameTitle, { color: colors.text }]}>
                    Marigold (Floriculture)
                  </Text>
                  <View style={styles.goldBadge}>
                    <Text style={styles.goldBadgeText}>🌼 High Demand</Text>
                  </View>
                </View>
                <Text style={styles.widgetSourceText}>
                  FarmsKing Live Telemetry • Firozpur Mandi
                </Text>
              </View>
            </View>

            {/* Right Controls: Unit Toggle & Refresh */}
            <View style={styles.controlsRow}>
              <View style={styles.unitPillContainer}>
                <TouchableOpacity
                  style={[styles.unitPillBtn, unit === 'KG' && styles.unitPillActive]}
                  onPress={() => {
                    tap();
                    setUnit('KG');
                  }}
                >
                  <Text style={[styles.unitPillText, unit === 'KG' && styles.unitPillTextActive]}>
                    KG
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitPillBtn, unit === 'QUINTAL' && styles.unitPillActive]}
                  onPress={() => {
                    tap();
                    setUnit('QUINTAL');
                  }}
                >
                  <Text style={[styles.unitPillText, unit === 'QUINTAL' && styles.unitPillTextActive]}>
                    Qtl
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.refreshBtn}
                activeOpacity={0.7}
                onPress={() => {
                  tap();
                  refetch();
                }}
              >
                {isRefetching || isLoading ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <Ionicons name="refresh" size={14} color="#10b981" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Telemetry Grid (3 Columns) */}
          <View style={styles.telemetryGrid}>
            {/* 1. Local Rate (Highlighted) */}
            <LinearGradient
              colors={isDark ? ['rgba(16, 185, 129, 0.18)', 'rgba(5, 150, 105, 0.08)'] : ['#ecfdf5', '#f0fdf4']}
              style={styles.telemetryTileMain}
            >
              <View style={styles.tileHeader}>
                <Text style={styles.tileSub}>Local Market (24h)</Text>
                <View style={styles.trendBadgeUp}>
                  <Ionicons name="trending-up" size={11} color="#059669" />
                  <Text style={styles.trendBadgeText}>+12.5%</Text>
                </View>
              </View>

              <View style={styles.rateValueRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.bigRateNumber}>
                  {formatInr(localAvg)}
                </Text>
                <Text style={styles.rateUnitText}>{unitLabel}</Text>
              </View>

              <View style={styles.minMaxRow}>
                <Text style={styles.minMaxText}>
                  Min: ₹{formatInr(localMin)} • Max: ₹{formatInr(localMax)}
                </Text>
                <Text style={styles.modalText}>
                  Modal: ₹{formatInr(localModal)}{unitLabel}
                </Text>
              </View>
            </LinearGradient>

            {/* 2. Punjab State Avg */}
            <View style={[styles.telemetryTileSub, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' }]}>
              <Text style={styles.tileSub}>Punjab State Avg</Text>
              <View style={styles.rateValueRowSmall}>
                <Text style={styles.currencySymbolSmall}>₹</Text>
                <Text style={[styles.midRateNumber, { color: colors.text }]}>
                  {formatInr(stateAvg)}
                </Text>
                <Text style={styles.rateUnitTextSmall}>{unitLabel}</Text>
              </View>
              <Text style={styles.compareNote}>State APMC Pool</Text>
            </View>

            {/* 3. National Hub (Delhi Ghazipur) */}
            <View style={[styles.telemetryTileSub, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' }]}>
              <Text style={styles.tileSub}>National Mandi Hub</Text>
              <View style={styles.rateValueRowSmall}>
                <Text style={styles.currencySymbolSmall}>₹</Text>
                <Text style={[styles.midRateNumber, { color: colors.text }]}>
                  {formatInr(nationalAvg)}
                </Text>
                <Text style={styles.rateUnitTextSmall}>{unitLabel}</Text>
              </View>
              <Text style={styles.compareNote}>Delhi Ghazipur Hub</Text>
            </View>
          </View>

          {/* Weather & Agronomy Strip */}
          <View style={styles.weatherStrip}>
            <View style={styles.weatherLeft}>
              <Ionicons name="sunny" size={16} color="#f59e0b" />
              <Text style={[styles.weatherTempText, { color: colors.text }]}>
                {weather?.temp || '24°C'} {weather?.condition || 'Sunny'}
              </Text>
              <Text style={styles.weatherDot}>•</Text>
              <Text style={styles.weatherParamText}>
                Rain: 0% • Wind: {weather?.windSpeed || '9 km/h'}
              </Text>
            </View>

            <View style={styles.spraySafePill}>
              <Ionicons name="checkmark-circle" size={12} color="#059669" />
              <Text style={styles.spraySafeText}>
                Safe to Spray Today
              </Text>
            </View>
          </View>

          {/* Quick Action Footer Buttons (Deep Links) */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.doctorActionBtn}
              activeOpacity={0.84}
              onPress={() => {
                tap();
                router.push('/(user)/(tabs)/farm?tab=CROP_CARE' as any);
              }}
            >
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.doctorActionGradient}
              >
                <Ionicons name="medical" size={13} color="#ffffff" />
                <Text style={styles.doctorActionText}>Crop Doctor Consultation</Text>
                <Ionicons name="chevron-forward" size={11} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mandiActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                },
              ]}
              activeOpacity={0.84}
              onPress={() => {
                tap();
                router.push('/(user)/(tabs)/farm' as any);
              }}
            >
              <Ionicons name="stats-chart" size={13} color="#10b981" />
              <Text style={[styles.mandiActionText, { color: colors.text }]}>
                Full Mandi History
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Guide Modal: How to Add to Android Home Screen */}
      <Modal
        visible={showHowToModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHowToModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="phone-portrait" size={18} color="#10b981" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Add Widget to Android Phone
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHowToModal(false)}>
                <Ionicons name="close" size={22} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.guideStepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    Long Press Home Screen
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.subText }]}>
                    On your Android smartphone, touch and hold any empty area on your home screen for 2 seconds.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    Tap "Widgets"
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.subText }]}>
                    Tap the "Widgets" icon that appears at the bottom of your phone display.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    Select "FarmsKing Live Telemetry"
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.subText }]}>
                    Scroll to FarmsKing and drag the 4×2 Marigold & Mandi Telemetry card onto your home screen.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#10b981' }]}>
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    24/7 Automatic Updates
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.subText }]}>
                    Your phone will automatically refresh prices and weather every 30 minutes with zero battery drain.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              activeOpacity={0.85}
              onPress={() => setShowHowToModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Got It, Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconSquircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  livePulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  livePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
  },
  livePulseText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  howToBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  howToBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  widgetOuterFrame: {
    width: '100%',
  },
  widgetCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  widgetTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  widgetLogoMini: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropNameTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  goldBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  goldBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#d97706',
  },
  widgetSourceText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitPillContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    padding: 2,
  },
  unitPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unitPillActive: {
    backgroundColor: '#10b981',
  },
  unitPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  unitPillTextActive: {
    color: '#ffffff',
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  telemetryTileMain: {
    flex: 1.4,
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    padding: 10,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileSub: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  trendBadgeUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  trendBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#059669',
  },
  rateValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginVertical: 4,
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#059669',
  },
  bigRateNumber: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#059669',
    letterSpacing: -0.5,
  },
  rateUnitText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#047857',
  },
  minMaxRow: {
    gap: 1,
  },
  minMaxText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  modalText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  telemetryTileSub: {
    flex: 1,
    minWidth: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    padding: 10,
    justifyContent: 'space-between',
  },
  rateValueRowSmall: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
    marginVertical: 4,
  },
  currencySymbolSmall: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  midRateNumber: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
  },
  rateUnitTextSmall: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  compareNote: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  weatherStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexWrap: 'wrap',
    gap: 6,
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  weatherTempText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  weatherDot: {
    fontSize: 11,
    color: '#94a3b8',
  },
  weatherParamText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  spraySafePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  spraySafeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  doctorActionBtn: {
    flex: 1.4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  doctorActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  doctorActionText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  mandiActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  mandiActionText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  guideStepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  stepDesc: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  modalDoneBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
