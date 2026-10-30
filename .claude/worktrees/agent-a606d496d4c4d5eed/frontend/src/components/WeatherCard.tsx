import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentWeather } from '../hooks/useWeather';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';

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

/** Compact single-row weather report bar for dashboard. */
export function WeatherCard() {
  const { data, isLoading, isError } = useCurrentWeather();

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
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
            <Ionicons name={CONDITION_ICON[data.condition] ?? 'partly-sunny'} size={20} color={theme.primary} />
            <Text style={styles.temperature}>{data.temperatureC}°C</Text>
            <Text style={styles.condition}>{data.condition}</Text>
          </View>

          <View style={styles.divider} />

          {/* Location & Conditions */}
          <View style={styles.centerMeta}>
            <Text style={styles.location} numberOfLines={1}>📍 {data.locationLabel}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              Feels {data.feelsLikeC}°C · Hum {data.humidityPct}%
            </Text>
          </View>

          {/* Live Badge */}
          <View style={styles.rightBadge}>
            <Ionicons name="cloud-done" size={11} color="#16a34a" />
            <Text style={styles.rightBadgeText}>LIVE</Text>
          </View>
        </View>
      )}
    </View>
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
});
