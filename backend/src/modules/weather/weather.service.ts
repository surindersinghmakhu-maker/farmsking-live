import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AdvisorAssignmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { AuthUser } from '../../common/types/auth-user.type';

const CACHE_TTL_MS = 15 * 60 * 1000;

/** WMO weather codes (used by Open-Meteo) collapsed into the coarse conditions the app displays. */
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

function conditionFromWeatherCode(code: number): string {
  if (RAIN_CODES.has(code)) {
    return code >= 95 ? 'Thunderstorm' : code <= 57 ? 'Drizzle' : 'Rain';
  }
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 71 && code <= 86) return 'Snow';
  if (code === 0) return 'Clear';
  return 'Clouds';
}

export interface CurrentWeather {
  locationLabel: string;
  temperatureC: number;
  feelsLikeC: number;
  condition: string;
  isRaining: boolean;
  humidityPct: number;
  windSpeedMs: number;
  observedAt: string;
}

interface CacheEntry {
  data: CurrentWeather;
  expiresAt: number;
}

interface LocationProfile {
  pincode: string | null;
  postOffice: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
}

export type WeatherAlertTrigger = 'RAIN' | 'MIN_TEMP' | 'MAX_TEMP';

export interface FarmerWeatherAlert {
  farmerId: string;
  farmerName: string;
  kingId: string | null;
  photoUrl: string | null;
  triggers: WeatherAlertTrigger[];
  currentTemperatureC: number;
  isRaining: boolean;
  condition: string;
  locationLabel: string;
  minTempC: number | null;
  maxTempC: number | null;
}

@Injectable()
export class WeatherService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
  ) {}

  /** PIN codes aren't place names Open-Meteo's geocoder understands — resolve to "District, State" via India Post's free API first. */
  private async resolvePincodeToPlace(pincode: string): Promise<string | null> {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      if (!response.ok) return null;
      const body = await response.json();
      const record = body?.[0];
      const office = record?.Status === 'Success' ? record.PostOffice?.[0] : null;
      if (!office) return null;
      return [office.District, office.State].filter(Boolean).join(', ') || null;
    } catch {
      return null;
    }
  }

  /** Resolves a profile's address fields to an Open-Meteo-friendly place query + a human display label. */
  private async placeFromProfile(profile: LocationProfile): Promise<{ query: string; label: string } | null> {
    const place =
      (profile.pincode ? await this.resolvePincodeToPlace(profile.pincode) : null) ||
      profile.district ||
      profile.state ||
      profile.postOffice ||
      profile.village;
    if (!place) return null;

    const label =
      [profile.postOffice, profile.district, profile.state].filter(Boolean).join(', ') ||
      [profile.village, profile.district, profile.state].filter(Boolean).join(', ');
    return { query: place, label };
  }

  private async resolveLocation(user: AuthUser, targetUserId?: string): Promise<{ query: string; label: string }> {
    let profileId = user.id;

    if (targetUserId && targetUserId !== user.id) {
      if (user.role !== Role.ADVISOR) {
        throw new NotFoundException('Only an assigned advisor can view another user\'s weather.');
      }
      // Throws if this advisor isn't (or is no longer) linked to that farmer/gardener.
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetUserId);
      profileId = targetUserId;
    }

    const profile = await this.prisma.user.findUnique({
      where: { id: profileId },
      select: { pincode: true, postOffice: true, village: true, district: true, state: true },
    });
    if (!profile) {
      throw new NotFoundException('User not found.');
    }

    const place = await this.placeFromProfile(profile);
    if (!place) {
      throw new NotFoundException('Add your PIN code to your profile to see local weather.');
    }
    return place;
  }

  /** Open-Meteo's free geocoder — no API key required. Resolves a place name to lat/lon, preferring an Indian match. */
  private async geocode(query: string): Promise<{ latitude: number; longitude: number }> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new ServiceUnavailableException('Could not resolve your location right now.');
    }

    const body = await response.json();
    const results: Array<{ latitude: number; longitude: number; country_code?: string }> = body.results ?? [];
    if (results.length === 0) {
      throw new NotFoundException('Could not find weather data for your location.');
    }

    const match = results.find((r) => r.country_code === 'IN') ?? results[0];
    return { latitude: match.latitude, longitude: match.longitude };
  }

  private async fetchCurrent(query: string): Promise<CurrentWeather> {
    const { latitude, longitude } = await this.geocode(query);

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new ServiceUnavailableException('Could not fetch weather data right now.');
    }

    const body = await response.json();
    const current = body.current ?? {};
    const condition = conditionFromWeatherCode(current.weather_code);

    return {
      locationLabel: query,
      temperatureC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature),
      condition,
      isRaining: RAIN_CODES.has(current.weather_code),
      humidityPct: Math.round(current.relative_humidity_2m),
      windSpeedMs: current.wind_speed_10m,
      observedAt: new Date().toISOString(),
    };
  }

  /** Cached current-weather lookup for an already-resolved place query + display label. */
  private async getCurrentForPlace(place: { query: string; label: string }): Promise<CurrentWeather> {
    const cached = this.cache.get(place.query);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data = await this.fetchCurrent(place.query);
    data.locationLabel = place.label || data.locationLabel;
    this.cache.set(place.query, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }

  async getCurrent(user: AuthUser, targetUserId?: string): Promise<CurrentWeather> {
    const place = await this.resolveLocation(user, targetUserId);
    return this.getCurrentForPlace(place);
  }

  /**
   * For the advisor dashboard's Weather Alerts tab: every ACTIVE assigned farmer who has at least one
   * weather-alert threshold configured, whose current weather currently crosses it (rain expected while
   * their rain alert is on, or the live temperature is outside their [min, max] range). Farmers with no
   * threshold configured, or a resolvable-but-unremarkable weather reading, are left out entirely.
   */
  async getAdvisorAlerts(advisor: AuthUser): Promise<FarmerWeatherAlert[]> {
    const assignments = await this.prisma.advisorAssignment.findMany({
      where: { advisorId: advisor.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      select: {
        farmer: {
          select: {
            id: true,
            name: true,
            kingId: true,
            photoUrl: true,
            pincode: true,
            postOffice: true,
            village: true,
            district: true,
            state: true,
            weatherAlertMinTempC: true,
            weatherAlertMaxTempC: true,
            weatherAlertRainEnabled: true,
          },
        },
      },
    });

    const candidates = assignments
      .map((a) => a.farmer)
      .filter((f) => f.weatherAlertRainEnabled || f.weatherAlertMinTempC != null || f.weatherAlertMaxTempC != null);

    const results = await Promise.all(
      candidates.map(async (farmer): Promise<FarmerWeatherAlert | null> => {
        const place = await this.placeFromProfile(farmer);
        if (!place) return null;

        let weather: CurrentWeather;
        try {
          weather = await this.getCurrentForPlace(place);
        } catch {
          return null;
        }

        const triggers: WeatherAlertTrigger[] = [];
        if (farmer.weatherAlertRainEnabled && weather.isRaining) triggers.push('RAIN');
        if (farmer.weatherAlertMinTempC != null && weather.temperatureC < farmer.weatherAlertMinTempC) triggers.push('MIN_TEMP');
        if (farmer.weatherAlertMaxTempC != null && weather.temperatureC > farmer.weatherAlertMaxTempC) triggers.push('MAX_TEMP');
        if (triggers.length === 0) return null;

        return {
          farmerId: farmer.id,
          farmerName: farmer.name,
          kingId: farmer.kingId,
          photoUrl: farmer.photoUrl,
          triggers,
          currentTemperatureC: weather.temperatureC,
          isRaining: weather.isRaining,
          condition: weather.condition,
          locationLabel: weather.locationLabel,
          minTempC: farmer.weatherAlertMinTempC,
          maxTempC: farmer.weatherAlertMaxTempC,
        };
      }),
    );

    return results.filter((r): r is FarmerWeatherAlert => r !== null);
  }
}
