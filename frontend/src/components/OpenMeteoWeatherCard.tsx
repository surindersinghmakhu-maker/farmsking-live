import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  conditionText: string;
  conditionIcon: keyof typeof Ionicons.glyphMap;
  advice: string;
  isSpraySafe: boolean;
  locationName: string;
  daily: Array<{
    day: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
    icon: keyof typeof Ionicons.glyphMap;
    rainProb: number;
  }>;
}

function getWeatherInfo(code: number, rainProb: number = 0): {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  advice: string;
  isSpraySafe: boolean;
} {
  switch (code) {
    case 0:
      return {
        text: 'Sunny Clear Sky',
        icon: 'sunny-outline',
        advice: '🌾 Great day for crop spraying & field irrigation.',
        isSpraySafe: true,
      };
    case 1:
    case 2:
      return {
        text: 'Partly Cloudy',
        icon: 'cloudy-night-outline',
        advice: '🌱 Inspect crop conditions; weather is favorable for spraying.',
        isSpraySafe: true,
      };
    case 3:
      return {
        text: 'Overcast Sky',
        icon: 'cloud-outline',
        advice: '⛅ Overcast sky; avoid crop spraying during strong winds.',
        isSpraySafe: true,
      };
    case 45:
    case 48:
      return {
        text: 'Foggy / Mist',
        icon: 'cloud-sharp',
        advice: '🌫️ Dense fog: monitor crops closely for fungal diseases.',
        isSpraySafe: false,
      };
    case 51:
    case 53:
    case 55:
      return {
        text: 'Light Drizzle',
        icon: 'rainy-outline',
        advice: '🌧️ Light drizzle: delay crop spraying for a while.',
        isSpraySafe: false,
      };
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return {
        text: 'Rain Showers',
        icon: 'rainy',
        advice: '⚠️ Rain expected: postpone pesticide & fertilizer spray.',
        isSpraySafe: false,
      };
    case 95:
    case 96:
    case 99:
      return {
        text: 'Thunderstorm',
        icon: 'thunderstorm-outline',
        advice: '🌩️ High winds & storm: stop field irrigation immediately.',
        isSpraySafe: false,
      };
    default:
      return {
        text: rainProb > 40 ? 'Rain Likely' : 'Normal Weather',
        icon: rainProb > 40 ? 'rainy-outline' : 'partly-sunny-outline',
        advice: rainProb > 40 ? '⚠️ Rain likely today: spray with caution.' : '🌾 Favorable weather for field activities.',
        isSpraySafe: rainProb <= 40,
      };
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Resolve exact latitude, longitude & place name from user's postal PIN code or district */
async function getCoordsForPincode(
  pincode?: string,
  district?: string,
  village?: string
): Promise<{ lat: number; lon: number; name: string }> {
  const defaultCoords = { lat: 30.9010, lon: 75.8573, name: 'Ludhiana, PB' };

  try {
    let searchTerm = district || village || '';
    let pinDistrictName = '';

    if (pincode && pincode.trim().length === 6) {
      try {
        const pinRes = await fetch(`https://api.postalpincode.in/pincode/${pincode.trim()}`);
        if (pinRes.ok) {
          const pinJson = await pinRes.json();
          if (pinJson?.[0]?.Status === 'Success' && pinJson[0].PostOffice?.[0]) {
            const po = pinJson[0].PostOffice[0];
            pinDistrictName = po.District || po.Name;
            searchTerm = `${pinDistrictName}, ${po.State || 'Punjab'}, India`;
          }
        }
      } catch (e) {
        console.warn('Postal PIN lookup failed:', e);
      }
    }

    if (!searchTerm && (district || village)) {
      searchTerm = `${district || village}, Punjab, India`;
    }

    if (!searchTerm) {
      return defaultCoords;
    }

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=1&language=en&format=json`
    );

    if (geoRes.ok) {
      const geoJson = await geoRes.json();
      if (geoJson.results && geoJson.results.length > 0) {
        const result = geoJson.results[0];
        const placeName = result.name || pinDistrictName || district || 'Location';
        const displayLocationName = pincode ? `${placeName} (${pincode})` : `${placeName}, ${result.admin1 || 'PB'}`;
        return {
          lat: result.latitude,
          lon: result.longitude,
          name: displayLocationName,
        };
      }
    }
  } catch (e) {
    console.warn('Geocoding error:', e);
  }

  const fallbackName = pincode
    ? `${district || village || 'PIN'} (${pincode})`
    : `${district || village || 'Ludhiana, PB'}`;
  return { ...defaultCoords, name: fallbackName };
}

export function OpenMeteoWeatherCard() {
  const { user } = useAuth();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    setError(false);
    try {
      const location = await getCoordsForPincode(user?.pincode || undefined, user?.district || undefined, user?.village || undefined);

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
      );

      if (!res.ok) throw new Error('Open-Meteo HTTP error');

      const json = await res.json();
      const current = json.current;
      const daily = json.daily;

      const code = current.weather_code ?? 0;
      const rainProb = daily?.precipitation_probability_max?.[0] ?? 0;
      const info = getWeatherInfo(code, rainProb);

      const dailyList = (daily.time || []).slice(1, 6).map((timeStr: string, idx: number) => {
        const d = new Date(timeStr);
        const dayLabel = WEEKDAYS[d.getDay()] || timeStr;
        const dCode = daily.weather_code[idx + 1] ?? 0;
        const dInfo = getWeatherInfo(dCode);
        return {
          day: dayLabel,
          maxTemp: Math.round(daily.temperature_2m_max[idx + 1] ?? 0),
          minTemp: Math.round(daily.temperature_2m_min[idx + 1] ?? 0),
          weatherCode: dCode,
          icon: dInfo.icon,
          rainProb: daily.precipitation_probability_max[idx + 1] ?? 0,
        };
      });

      setData({
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        precipitation: current.precipitation ?? 0,
        weatherCode: code,
        conditionText: info.text,
        conditionIcon: info.icon,
        advice: info.advice,
        isSpraySafe: info.isSpraySafe,
        locationName: location.name,
        daily: dailyList,
      });
    } catch (e) {
      console.warn('OpenMeteo fetch failed:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [user?.pincode, user?.district, user?.village]);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => setExpanded(!expanded)}
      style={[styles.card, premiumShadow('#0f172a', 'sm')]}
    >
      {/* Compact Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.liveTag}>
            <Text style={styles.liveTagText}>LIVE OPEN-METEO</Text>
          </View>
          <Text style={styles.headerTitle}>🌤️ Weather</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {data?.locationName || (user?.pincode ? `PIN ${user.pincode}` : `${user?.district || 'Punjab'}`)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              fetchWeather();
            }}
          >
            <Ionicons name="refresh" size={13} color="#0284c7" />
          </TouchableOpacity>
          <Ionicons
            name={expanded ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
            size={18}
            color="#0284c7"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBoxCompact}>
          <ActivityIndicator size="small" color="#0284c7" />
          <Text style={styles.loadingText}>Fetching live weather...</Text>
        </View>
      ) : error || !data ? (
        <View style={styles.centerBoxCompact}>
          <Text style={styles.errorText}>Weather service unavailable</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchWeather}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contentBody}>
          {/* Collapsed Compact Row */}
          {!expanded && (
            <View style={styles.compactBar}>
              <View style={styles.compactBarLeft}>
                <Ionicons name={data.conditionIcon} size={24} color="#0284c7" />
                <Text style={styles.compactTempText}>{data.temp}°C</Text>
                <Text style={styles.compactConditionText} numberOfLines={1}>{data.conditionText}</Text>
                <View style={styles.metricDotDivider} />
                <Text style={styles.compactMetricsText} numberOfLines={1}>
                  💧 {data.humidity}% · 💨 {data.windSpeed}km/h
                </Text>
              </View>

              <View
                style={[
                  styles.sprayPill,
                  { backgroundColor: data.isSpraySafe ? '#dcfce7' : '#fee2e2' },
                ]}
              >
                <Ionicons
                  name={data.isSpraySafe ? 'checkmark-circle' : 'warning'}
                  size={12}
                  color={data.isSpraySafe ? '#15803d' : '#dc2626'}
                />
                <Text
                  style={[
                    styles.sprayPillText,
                    { color: data.isSpraySafe ? '#166534' : '#991b1b' },
                  ]}
                >
                  {data.isSpraySafe ? 'Spray Safe' : 'Avoid Spray'}
                </Text>
              </View>
            </View>
          )}

          {/* Expanded Executive Details View */}
          {expanded && (
            <View style={styles.expandedContent}>
              {/* Main Weather Metric Banner */}
              <View style={styles.mainBanner}>
                <View style={styles.tempSection}>
                  <Ionicons name={data.conditionIcon} size={36} color="#0284c7" />
                  <View>
                    <Text style={styles.mainTempText}>{data.temp}°C</Text>
                    <Text style={styles.feelsLikeText}>Feels like {data.feelsLike}°C</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.expandedConditionText}>{data.conditionText}</Text>
                  <View style={styles.metricsPillsRow}>
                    <View style={styles.metricChip}>
                      <Ionicons name="water-outline" size={11} color="#0284c7" />
                      <Text style={styles.metricChipText}>Humidity {data.humidity}%</Text>
                    </View>
                    <View style={styles.metricChip}>
                      <Ionicons name="navigate-outline" size={11} color="#0369a1" />
                      <Text style={styles.metricChipText}>Wind {data.windSpeed}km/h</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Spray Advisory Alert */}
              <View
                style={[
                  styles.advisoryAlert,
                  {
                    backgroundColor: data.isSpraySafe ? '#f0fdf4' : '#fff1f2',
                    borderColor: data.isSpraySafe ? '#bbf7d0' : '#fca5a5',
                  },
                ]}
              >
                <Ionicons
                  name={data.isSpraySafe ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={data.isSpraySafe ? '#166534' : '#991b1b'}
                />
                <Text
                  style={[
                    styles.advisoryAlertText,
                    { color: data.isSpraySafe ? '#15803d' : '#991b1b' },
                  ]}
                >
                  {data.advice}
                </Text>
              </View>

              {/* 5-Day Compact Forecast */}
              {data.daily && data.daily.length > 0 && (
                <View style={styles.forecastBox}>
                  <Text style={styles.forecastHeaderTitle}>📅 5-Day Weather Forecast</Text>
                  <View style={styles.forecastGrid}>
                    {data.daily.map((item, index) => (
                      <View key={index} style={styles.forecastItemCard}>
                        <Text style={styles.forecastDayText}>{item.day}</Text>
                        <Ionicons name={item.icon} size={18} color="#0284c7" style={{ marginVertical: 2 }} />
                        <Text style={styles.forecastTempRange}>{item.maxTemp}°/{item.minTemp}°</Text>
                        {item.rainProb > 20 && (
                          <Text style={styles.forecastRainProb}>🌧️ {item.rainProb}%</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.collapseRow}>
                <Text style={styles.collapseText}>Tap to collapse weather details</Text>
                <Ionicons name="chevron-up" size={12} color="#0284c7" />
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveTag: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
  },
  liveTagText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  locationText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0284c7',
    flex: 1,
  },
  refreshBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBoxCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  loadingText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  errorText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  contentBody: {
    marginTop: 2,
  },

  /* Compact Collapsed Row */
  compactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  compactBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  compactTempText: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  compactConditionText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  metricDotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
  },
  compactMetricsText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  sprayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill || 12,
  },
  sprayPillText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },

  /* Expanded Executive View */
  expandedContent: {
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  mainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tempSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainTempText: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    lineHeight: 26,
  },
  feelsLikeText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  detailSection: {
    alignItems: 'flex-end',
    gap: 3,
  },
  expandedConditionText: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#0284c7',
  },
  metricsPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricChipText: {
    fontSize: 9,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  advisoryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  advisoryAlertText: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: FONT.bold,
    lineHeight: 14,
  },
  forecastBox: {
    paddingTop: 4,
  },
  forecastHeaderTitle: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#475569',
    marginBottom: 4,
  },
  forecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  forecastItemCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  forecastDayText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  forecastTempRange: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  forecastRainProb: {
    fontSize: 8,
    fontFamily: FONT.extraBold,
    color: '#0284c7',
    marginTop: 1,
  },
  collapseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
  },
  collapseText: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#0284c7',
  },
});
