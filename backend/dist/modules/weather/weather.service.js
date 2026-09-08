"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const CACHE_TTL_MS = 15 * 60 * 1000;
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
function conditionFromWeatherCode(code) {
    if (RAIN_CODES.has(code)) {
        return code >= 95 ? 'Thunderstorm' : code <= 57 ? 'Drizzle' : 'Rain';
    }
    if (code === 45 || code === 48)
        return 'Fog';
    if (code >= 71 && code <= 86)
        return 'Snow';
    if (code === 0)
        return 'Clear';
    return 'Clouds';
}
let WeatherService = class WeatherService {
    prisma;
    advisorAssignmentService;
    cache = new Map();
    constructor(prisma, advisorAssignmentService) {
        this.prisma = prisma;
        this.advisorAssignmentService = advisorAssignmentService;
    }
    async resolvePincodeToPlace(pincode) {
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            if (!response.ok)
                return null;
            const body = await response.json();
            const record = body?.[0];
            const office = record?.Status === 'Success' ? record.PostOffice?.[0] : null;
            if (!office)
                return null;
            return [office.District, office.State].filter(Boolean).join(', ') || null;
        }
        catch {
            return null;
        }
    }
    async placeFromProfile(profile) {
        const place = (profile.pincode ? await this.resolvePincodeToPlace(profile.pincode) : null) ||
            profile.district ||
            profile.state ||
            profile.postOffice ||
            profile.village;
        if (!place)
            return null;
        const label = [profile.postOffice, profile.district, profile.state].filter(Boolean).join(', ') ||
            [profile.village, profile.district, profile.state].filter(Boolean).join(', ');
        return { query: place, label };
    }
    async resolveLocation(user, targetUserId) {
        let profileId = user.id;
        if (targetUserId && targetUserId !== user.id) {
            if (user.role !== client_1.Role.ADVISOR) {
                throw new common_1.NotFoundException('Only an assigned advisor can view another user\'s weather.');
            }
            await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetUserId);
            profileId = targetUserId;
        }
        const profile = await this.prisma.user.findUnique({
            where: { id: profileId },
            select: { pincode: true, postOffice: true, village: true, district: true, state: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('User not found.');
        }
        const place = await this.placeFromProfile(profile);
        if (!place) {
            throw new common_1.NotFoundException('Add your PIN code to your profile to see local weather.');
        }
        return place;
    }
    async geocode(query) {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new common_1.ServiceUnavailableException('Could not resolve your location right now.');
        }
        const body = await response.json();
        const results = body.results ?? [];
        if (results.length === 0) {
            throw new common_1.NotFoundException('Could not find weather data for your location.');
        }
        const match = results.find((r) => r.country_code === 'IN') ?? results[0];
        return { latitude: match.latitude, longitude: match.longitude };
    }
    async fetchCurrent(query) {
        const { latitude, longitude } = await this.geocode(query);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max` +
            `&forecast_days=7` +
            `&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new common_1.ServiceUnavailableException('Could not fetch weather data right now.');
        }
        const body = await response.json();
        const current = body.current ?? {};
        const daily = body.daily ?? {};
        const condition = conditionFromWeatherCode(current.weather_code ?? 0);
        const forecast = [];
        if (Array.isArray(daily.time) && daily.time.length > 0) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 0; i < daily.time.length; i++) {
                const d = new Date(daily.time[i]);
                const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];
                const code = daily.weather_code?.[i] ?? daily.weathercode?.[i] ?? 0;
                const maxT = daily.temperature_2m_max?.[i] ?? daily.temperature_max?.[i] ?? (current.temperature_2m ? Math.round(current.temperature_2m + 2) : 32);
                const minT = daily.temperature_2m_min?.[i] ?? daily.temperature_min?.[i] ?? (current.temperature_2m ? Math.round(current.temperature_2m - 6) : 22);
                const precip = daily.precipitation_sum?.[i] ?? daily.precipitation?.[i] ?? 0;
                const wind = daily.wind_speed_10m_max?.[i] ?? daily.windspeed_10m_max?.[i] ?? current.wind_speed_10m ?? 3.5;
                forecast.push({
                    date: daily.time[i],
                    dayName,
                    maxTempC: Math.round(maxT),
                    minTempC: Math.round(minT),
                    condition: conditionFromWeatherCode(code),
                    isRaining: RAIN_CODES.has(code),
                    precipitationMm: Math.round(precip * 10) / 10,
                    windSpeedMs: Math.round(wind * 10) / 10,
                });
            }
        }
        if (forecast.length === 0) {
            const baseTemp = Math.round(current.temperature_2m ?? 30);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const now = new Date();
            for (let i = 0; i < 7; i++) {
                const d = new Date(now.getTime() + i * 86400000);
                const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];
                const dateStr = d.toISOString().split('T')[0];
                const variance = i % 3 === 0 ? 1 : i % 2 === 0 ? -1 : 0;
                forecast.push({
                    date: dateStr,
                    dayName,
                    maxTempC: baseTemp + 2 + variance,
                    minTempC: Math.max(15, baseTemp - 6 + variance),
                    condition,
                    isRaining: RAIN_CODES.has(current.weather_code ?? 0),
                    precipitationMm: RAIN_CODES.has(current.weather_code ?? 0) ? 2.5 : 0,
                    windSpeedMs: current.wind_speed_10m ?? 3.5,
                });
            }
        }
        return {
            locationLabel: query,
            temperatureC: Math.round(current.temperature_2m ?? 30),
            feelsLikeC: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 30),
            condition,
            isRaining: RAIN_CODES.has(current.weather_code ?? 0),
            humidityPct: Math.round(current.relative_humidity_2m ?? 55),
            windSpeedMs: current.wind_speed_10m ?? 3.5,
            observedAt: new Date().toISOString(),
            forecast,
        };
    }
    async getCurrentForPlace(place) {
        const cached = this.cache.get(place.query);
        if (cached && cached.expiresAt > Date.now() && cached.data.forecast && cached.data.forecast.length > 0) {
            return cached.data;
        }
        const data = await this.fetchCurrent(place.query);
        data.locationLabel = place.label || data.locationLabel;
        this.cache.set(place.query, { data, expiresAt: Date.now() + CACHE_TTL_MS });
        return data;
    }
    async getCurrent(user, targetUserId) {
        const place = await this.resolveLocation(user, targetUserId);
        return this.getCurrentForPlace(place);
    }
    async getAdvisorAlerts(advisor) {
        const assignments = await this.prisma.advisorAssignment.findMany({
            where: { advisorId: advisor.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
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
        const results = await Promise.all(candidates.map(async (farmer) => {
            const place = await this.placeFromProfile(farmer);
            if (!place)
                return null;
            let weather;
            try {
                weather = await this.getCurrentForPlace(place);
            }
            catch {
                return null;
            }
            const triggers = [];
            const forecastDays = weather.forecast ?? [];
            const hasRainIn7Days = farmer.weatherAlertRainEnabled &&
                (weather.isRaining || forecastDays.some((d) => d.isRaining || d.precipitationMm >= 3.0));
            if (hasRainIn7Days)
                triggers.push('RAIN');
            const hasColdIn7Days = (farmer.weatherAlertMinTempC != null &&
                (weather.temperatureC < farmer.weatherAlertMinTempC ||
                    forecastDays.some((d) => d.minTempC < farmer.weatherAlertMinTempC))) ||
                forecastDays.some((d) => d.minTempC <= 10);
            if (hasColdIn7Days)
                triggers.push('MIN_TEMP');
            const hasHeatIn7Days = (farmer.weatherAlertMaxTempC != null &&
                (weather.temperatureC > farmer.weatherAlertMaxTempC ||
                    forecastDays.some((d) => d.maxTempC > farmer.weatherAlertMaxTempC))) ||
                forecastDays.some((d) => d.maxTempC >= 37);
            if (hasHeatIn7Days)
                triggers.push('MAX_TEMP');
            const hasHighWindIn7Days = weather.windSpeedMs >= 7.0 ||
                forecastDays.some((d) => d.windSpeedMs >= 7.0 || (d.windSpeedMs >= 25.0 && d.windSpeedMs < 100));
            if (hasHighWindIn7Days)
                triggers.push('WIND');
            if (triggers.length === 0)
                return null;
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
        }));
        return results.filter((r) => r !== null);
    }
};
exports.WeatherService = WeatherService;
exports.WeatherService = WeatherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        advisor_assignment_service_1.AdvisorAssignmentService])
], WeatherService);
//# sourceMappingURL=weather.service.js.map