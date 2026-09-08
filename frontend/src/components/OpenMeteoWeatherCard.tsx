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

export function OpenMeteoWeatherCard() {
  const { user } = useAuth();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cityName = user?.district || user?.village || 'Ludhiana, Punjab';

  const fetchWeather = async () => {
    setLoading(true);
    setError(false);
    try {
      const lat = 30.9010;
      const lon = 75.8573;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
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
  }, []);

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.liveTag}>
            <Text style={styles.liveTagText}>LIVE OPEN-METEO</Text>
          </View>
          <Text style={styles.headerTitle}>🌤️ Agri Weather Forecast</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather}>
          <Ionicons name="refresh" size={14} color="#0284c7" />
          <Text style={styles.locationText}>📍 {cityName}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0284c7" />
          <Text style={styles.loadingText}>Fetching Open-Meteo live weather...</Text>
        </View>
      ) : error || !data ? (
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b' }}>
            Unable to fetch weather forecast right now.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchWeather}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {/* Main Weather Display Banner */}
          <View style={styles.bannerRow}>
            <View style={styles.mainTempGroup}>
              <Ionicons name={data.conditionIcon} size={42} color="#0284c7" />
              <View>
                <Text style={styles.tempText}>{data.temp}°C</Text>
                <Text style={styles.feelsLikeText}>Feels like: {data.feelsLike}°C</Text>
              </View>
            </View>

            <View style={styles.conditionGroup}>
              <Text style={styles.conditionTitle}>{data.conditionText}</Text>
              <View style={styles.metricsRow}>
                <View style={styles.metricBadge}>
                  <Ionicons name="water-outline" size={11} color="#0284c7" />
                  <Text style={styles.metricText}>Humidity: {data.humidity}%</Text>
                </View>
                <View style={styles.metricBadge}>
                  <Ionicons name="navigate-outline" size={11} color="#0369a1" />
                  <Text style={styles.metricText}>Wind: {data.windSpeed} km/h</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Agri Spray Advisory Banner */}
          <View
            style={[
              styles.advisoryBanner,
              {
                backgroundColor: data.isSpraySafe ? '#f0fdf4' : '#fff1f2',
                borderColor: data.isSpraySafe ? '#bbf7d0' : '#fca5a5',
              },
            ]}
          >
            <Ionicons
              name={data.isSpraySafe ? 'checkmark-circle-outline' : 'warning-outline'}
              size={18}
              color={data.isSpraySafe ? '#166534' : '#991b1b'}
            />
            <Text
              style={[
                styles.advisoryText,
                { color: data.isSpraySafe ? '#15803d' : '#991b1b' },
              ]}
            >
              {data.advice}
            </Text>
          </View>

          {/* 5-Day Forecast Row */}
          {data.daily && data.daily.length > 0 ? (
            <View style={styles.forecastContainer}>
              <Text style={styles.forecastHeader}>📅 5-Day Weather Forecast</Text>
              <View style={styles.forecastRow}>
                {data.daily.map((item, index) => (
                  <View key={index} style={styles.forecastCol}>
                    <Text style={styles.forecastDay}>{item.day}</Text>
                    <Ionicons name={item.icon} size={20} color="#0284c7" style={{ marginVertical: 2 }} />
                    <Text style={styles.forecastTemp}>{item.maxTemp}° / {item.minTemp}°</Text>
                    {item.rainProb > 20 ? (
                      <Text style={styles.rainProbText}>🌧️ {item.rainProb}%</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liveTag: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  liveTagText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
  },
  headerTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#0284c7',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  mainTempGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempText: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    lineHeight: 28,
  },
  feelsLikeText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  conditionGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  conditionTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0284c7',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  metricBadge: {
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
  metricText: {
    fontSize: 9.5,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  advisoryText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT.bold,
    lineHeight: 15,
  },
  forecastContainer: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  forecastHeader: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#475569',
    marginBottom: 6,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  forecastCol: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  forecastDay: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  forecastTemp: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  rainProbText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#0284c7',
    marginTop: 1,
  },
});
