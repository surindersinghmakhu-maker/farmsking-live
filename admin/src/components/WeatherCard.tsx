import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCurrentWeather } from '../hooks/useWeather';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, premiumShadow } from '../../constants/theme';
import { WeatherForecastModal } from './WeatherForecastModal';

const theme = RoleThemes.FARMER;

const CONDITION_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'thunderstorm',
  Snow: 'snow',
  Mist: 'cloud-outline',
  Fog: 'cloud-outline',
  Haze: 'cloud-outline',
};

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/** Compact single-row weather report bar for dashboard with blinking alert indicator on 7-day weather alerts. */
export function WeatherCard() {
  const { data, isLoading, isError } = useCurrentWeather();
  const [modalVisible, setModalVisible] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const alertInfo = useMemo(() => {
    if (!data) return null;
    const alertForecast = (data.forecast ?? []).slice(0, 1);

    const isRain = data.isRaining || alertForecast.some((d) => d.isRaining || d.precipitationMm >= 3.0);
    const isHeat = alertForecast.some((d) => d.maxTempC >= 37);
    const isCold = alertForecast.some((d) => d.minTempC <= 10);
    const isWind = alertForecast.some((d) => d.windSpeedMs >= 7.0 || (d.windSpeedMs >= 25.0 && d.windSpeedMs < 100));

    // High / Extreme alert thresholds
    const isHighRain = alertForecast.some((d) => d.precipitationMm >= 15.0) || (data.isRaining && alertForecast.some((d) => d.precipitationMm >= 10.0));
    const isHighHeat = alertForecast.some((d) => d.maxTempC >= 41);
    const isHighCold = alertForecast.some((d) => d.minTempC <= 5);
    const isHighWind = alertForecast.some((d) => d.windSpeedMs >= 15.0);

    if (isRain) return { label: isHighRain ? '⚠️ HEAVY RAIN' : '🌧️ RAIN ALERT', mainColor: '#0284c7', bg: '#0284c7', textColor: '#ffffff', cardBg: '#f0f9ff', cardBorder: '#38bdf8', isHigh: isHighRain };
    if (isHeat) return { label: isHighHeat ? '🚨 EXTREME HEAT' : '🔥 HEAT ALERT', mainColor: '#dc2626', bg: '#dc2626', textColor: '#ffffff', cardBg: '#fef2f2', cardBorder: '#fca5a5', isHigh: isHighHeat };
    if (isCold) return { label: isHighCold ? '🚨 SEVERE COLD' : '❄️ COLD ALERT', mainColor: '#1d4ed8', bg: '#1d4ed8', textColor: '#ffffff', cardBg: '#eff6ff', cardBorder: '#93c5fd', isHigh: isHighCold };
    if (isWind) return { label: isHighWind ? '🚨 HIGH WIND' : '💨 WIND ALERT', mainColor: '#d97706', bg: '#d97706', textColor: '#ffffff', cardBg: '#fffbeb', cardBorder: '#fde047', isHigh: isHighWind };

    return null;
  }, [data]);

  const shouldBlink = alertInfo?.isHigh === true;

  useEffect(() => {
    if (shouldBlink) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.15,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [shouldBlink, blinkAnim]);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          alertInfo && { borderColor: alertInfo.cardBorder, backgroundColor: alertInfo.cardBg, borderWidth: 2 },
          premiumShadow('#0f172a', 'sm'),
        ]}
        activeOpacity={0.8}
        onPress={() => {
          if (data) {
            tap();
            setModalVisible(true);
          }
        }}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.primary} size="small" style={styles.spinner} />
        ) : isError || !data ? (
          <View style={styles.singleRow}>
            <Ionicons name="cloud-offline-outline" size={18} color="#64748b" />
            <Text style={styles.emptyText}>Weather unavailable</Text>
          </View>
        ) : (
          <View style={styles.singleRow}>
            {/* Temperature & Icon */}
            <View style={styles.leftPill}>
              <Ionicons
                name={CONDITION_ICON[data.condition] ?? 'partly-sunny'}
                size={20}
                color={alertInfo ? alertInfo.mainColor : theme.primary}
              />
              <Text style={[styles.temperature, alertInfo && { color: alertInfo.mainColor }]}>{data.temperatureC}°C</Text>
              <Text style={[styles.condition, alertInfo && { color: alertInfo.mainColor }]}>{data.condition}</Text>
            </View>

            <View style={styles.divider} />

            {/* Location & Conditions */}
            <View style={styles.centerMeta}>
              <Text style={styles.location} numberOfLines={1}>📍 {data.locationLabel}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                Feels {data.feelsLikeC}°C · Hum {data.humidityPct}%
              </Text>
            </View>

            {/* Super Highlighted Weather Alert Indicator Badge (Blinks ONLY on HIGH severity alerts) */}
            {alertInfo ? (
              <Animated.View
                style={[
                  styles.superAlertBadge,
                  { backgroundColor: alertInfo.bg, borderColor: alertInfo.bg, opacity: shouldBlink ? blinkAnim : 1 },
                ]}
              >
                <Text style={[styles.superAlertText, { color: alertInfo.textColor }]}>
                  {alertInfo.label}
                </Text>
              </Animated.View>
            ) : (
              <View style={styles.rightBadge}>
                <Ionicons name="calendar-outline" size={11} color="#16a34a" />
                <Text style={styles.rightBadgeText}>7-DAY</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <WeatherForecastModal visible={modalVisible} weather={data} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  alertCardBorder: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  spinner: { paddingVertical: 4 },
  emptyText: { color: '#64748b', fontSize: 12, fontFamily: FONT.medium },
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  temperature: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  condition: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: theme.primary,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#cbd5e1',
  },
  centerMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  location: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  meta: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  rightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  rightBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  superAlertBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superAlertText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  alertBlinkBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  alertBlinkBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
  },
});
