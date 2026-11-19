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
exports.MarketRatesService = void 0;
exports.toEnglishCropName = toEnglishCropName;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const CROP_ENGLISH_MAP = {
    rose: 'Rose',
    gulab: 'Rose',
    'ਗੁਲਾਬ': 'Rose',
    'गुलाब': 'Rose',
    marigold: 'Marigold',
    genda: 'Marigold',
    'ਗੈਂਦਾ': 'Marigold',
    'गेंदा': 'Marigold',
    wheat: 'Wheat',
    kanak: 'Wheat',
    gehu: 'Wheat',
    'ਕਣਕ': 'Wheat',
    'ਗੇਹੂੰ': 'Wheat',
    paddy: 'Paddy',
    rice: 'Paddy',
    jona: 'Paddy',
    dhan: 'Paddy',
    'ਝੋਨਾ': 'Paddy',
    'ਚਾਵਲ': 'Paddy',
    'धान': 'Paddy',
    tomato: 'Tomato',
    tamatar: 'Tomato',
    'ਟਮਾਟਰ': 'Tomato',
    'टमाटर': 'Tomato',
    potato: 'Potato',
    aloo: 'Potato',
    'ਆਲੂ': 'Potato',
    'आलू': 'Potato',
    onion: 'Onion',
    pyaz: 'Onion',
    'ਪਿਆਜ਼': 'Onion',
    'प्याज': 'Onion',
    mustard: 'Mustard',
    sarson: 'Mustard',
    'ਸਰ੍ਹੋਂ': 'Mustard',
    'सरसों': 'Mustard',
    cotton: 'Cotton',
    narma: 'Cotton',
    kapas: 'Cotton',
    'ਨਰਮਾ': 'Cotton',
    'ਕਪਾਹ': 'Cotton',
    'कपास': 'Cotton',
    maize: 'Maize',
    makki: 'Maize',
    'ਮੱਕੀ': 'Maize',
    'मक्का': 'Maize',
    sugarcane: 'Sugarcane',
    ganna: 'Sugarcane',
    kamaad: 'Sugarcane',
    'ਗੰਨਾ': 'Sugarcane',
    'ਕਮਾਦ': 'Sugarcane',
    'गन्ना': 'Sugarcane',
};
function toEnglishCropName(rawName) {
    if (!rawName)
        return '';
    const cleaned = rawName.split('(')[0].trim();
    const key = cleaned.toLowerCase();
    if (CROP_ENGLISH_MAP[key])
        return CROP_ENGLISH_MAP[key];
    for (const [k, english] of Object.entries(CROP_ENGLISH_MAP)) {
        if (key.includes(k) || k.includes(key)) {
            return english;
        }
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
let MarketRatesService = class MarketRatesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.ratesCache = new Map();
        this.CACHE_TTL_MS = 30 * 1000;
    }
    async getMyCropRates(user) {
        const profile = user?.id
            ? await this.prisma.user.findUnique({
                where: { id: user.id },
                select: { state: true },
            })
            : null;
        const userState = (profile?.state || 'Punjab').trim();
        const cacheKey = `${user?.id || 'anon'}_${userState}`;
        const cached = this.ratesCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        const since = new Date(Date.now() - ONE_DAY_MS);
        const sinceTime = since.getTime();
        let cropCycles = [];
        if (user?.id) {
            cropCycles = await this.prisma.cropCycle.findMany({
                where: {
                    deletedAt: null,
                    NOT: [
                        { status: 'COMPLETED' },
                        { stage: 'COMPLETED' },
                        { status: 'FAILED' },
                        { status: 'DEACTIVE' },
                    ],
                    plot: { deletedAt: null, farm: { deletedAt: null, ownerId: user.id } },
                },
                select: { cropName: true, unit: true },
            });
        }
        const recentSaleItems = await this.prisma.saleItem.findMany({
            where: {
                createdAt: { gte: since },
                sale: { deletedAt: null },
            },
            select: {
                productName: true,
                unit: true,
                pricePerUnit: true,
                createdAt: true,
                sale: {
                    select: {
                        recordedBy: { select: { state: true } },
                    },
                },
            },
        });
        const recentSaleBills = await this.prisma.saleBill.findMany({
            where: { createdAt: { gte: since } },
            select: {
                createdAt: true,
                items: true,
                farmer: { select: { state: true } },
            },
        });
        const recentMarketRates = await this.prisma.marketRate.findMany({
            where: {
                rateDate: { gte: since },
                NOT: [
                    { source: 'arhtiya_crop_sale' },
                    { source: 'farmer_sale_bill' },
                    { source: 'farmer_sale_bill_update' },
                ],
            },
            select: {
                cropName: true,
                unit: true,
                minPrice: true,
                maxPrice: true,
                modalPrice: true,
                rateDate: true,
                state: true,
                source: true,
            },
        });
        const distinctCropMap = new Map();
        for (const c of cropCycles) {
            if (c.cropName) {
                const englishName = toEnglishCropName(c.cropName);
                const rawUnit = (c.unit || 'KG').trim().toUpperCase();
                const displayUnit = getNormalizedDisplayUnit(rawUnit);
                const key = `${englishName.toLowerCase()}_${displayUnit.toLowerCase()}`;
                if (!distinctCropMap.has(key)) {
                    distinctCropMap.set(key, { cropName: englishName, unit: displayUnit });
                }
            }
        }
        const distinctCrops = Array.from(distinctCropMap.values());
        const rates = await Promise.all(distinctCrops.map(async ({ cropName, unit: targetUnit }) => {
            const cropKey = cropName.toLowerCase().split('(')[0].trim();
            const localRatePool = [];
            const nationalRatePool = [];
            const matchesCrop = (targetName) => {
                if (!targetName)
                    return false;
                const t = targetName.split('(')[0].trim().toLowerCase();
                if (t === cropKey || t.includes(cropKey) || cropKey.includes(t))
                    return true;
                for (const [key, synonyms] of Object.entries(CROP_SYNONYMS)) {
                    const matchesKey = key === cropKey || synonyms.includes(cropKey);
                    const matchesTarget = synonyms.some((syn) => t.includes(syn) || syn.includes(t));
                    if (matchesKey && matchesTarget)
                        return true;
                }
                return false;
            };
            const isUserState = (st) => {
                if (!st || !userState)
                    return true;
                return st.trim().toLowerCase() === userState.toLowerCase();
            };
            const isWithin24h = (dt) => {
                if (!dt)
                    return true;
                const t = new Date(dt).getTime();
                return !isNaN(t) && t >= sinceTime;
            };
            for (const item of recentSaleItems) {
                if (matchesCrop(item.productName) && isWithin24h(item.createdAt)) {
                    const normalizedRate = normalizeToTargetUnit(Number(item.pricePerUnit), item.unit, targetUnit);
                    if (normalizedRate !== null && normalizedRate > 0) {
                        nationalRatePool.push(normalizedRate);
                        if (isUserState(item.sale?.recordedBy?.state)) {
                            localRatePool.push(normalizedRate);
                        }
                    }
                }
            }
            for (const bill of recentSaleBills) {
                const items = bill.items;
                if (Array.isArray(items)) {
                    for (const it of items) {
                        if (matchesCrop(it.cropName || it.productName)) {
                            const itemTime = it.timestamp || it.createdAt || bill.createdAt;
                            if (isWithin24h(itemTime)) {
                                const normalizedRate = normalizeToTargetUnit(Number(it.rate || it.pricePerUnit), it.unit, targetUnit);
                                if (normalizedRate !== null && normalizedRate > 0) {
                                    nationalRatePool.push(normalizedRate);
                                    if (isUserState(bill.farmer?.state)) {
                                        localRatePool.push(normalizedRate);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (const mr of recentMarketRates) {
                if (mr.source && (mr.source.startsWith('farmer_sale') || mr.source.startsWith('arhtiya'))) {
                    continue;
                }
                if (matchesCrop(mr.cropName) && isWithin24h(mr.rateDate)) {
                    const normalizedRate = normalizeToTargetUnit(Number(mr.modalPrice ?? mr.minPrice ?? mr.maxPrice), mr.unit, targetUnit);
                    if (normalizedRate !== null && normalizedRate > 0) {
                        nationalRatePool.push(normalizedRate);
                        if (isUserState(mr.state)) {
                            localRatePool.push(normalizedRate);
                        }
                    }
                }
            }
            let localMinRate = null;
            let localMaxRate = null;
            let localAvgRate = null;
            if (localRatePool.length > 0) {
                localMinRate = Math.min(...localRatePool);
                localMaxRate = Math.max(...localRatePool);
                const localSum = localRatePool.reduce((acc, r) => acc + r, 0);
                localAvgRate = Math.round((localSum / localRatePool.length) * 100) / 100;
            }
            let nationalMinRate = null;
            let nationalMaxRate = null;
            let nationalAvgRate = null;
            if (nationalRatePool.length > 0) {
                nationalMinRate = Math.min(...nationalRatePool);
                nationalMaxRate = Math.max(...nationalRatePool);
                const nationalSum = nationalRatePool.reduce((acc, r) => acc + r, 0);
                nationalAvgRate = Math.round((nationalSum / nationalRatePool.length) * 100) / 100;
            }
            return {
                cropName,
                unit: targetUnit,
                localMinRate,
                localMaxRate,
                localAvgRate,
                localSampleCount: localRatePool.length,
                nationalMinRate,
                nationalMaxRate,
                nationalAvgRate,
                nationalSampleCount: nationalRatePool.length,
            };
        }));
        const result = { state: userState, rates };
        this.ratesCache.set(cacheKey, { data: result, expiresAt: Date.now() + this.CACHE_TTL_MS });
        return result;
    }
    async getCropWidgetSummary(rawCropName = 'Marigold', targetState = 'Punjab', targetUnit = 'KG') {
        const englishCrop = toEnglishCropName(rawCropName);
        const cropKey = englishCrop.toLowerCase().split('(')[0].trim();
        const normalizedUnit = getNormalizedDisplayUnit(targetUnit);
        const allMarketRates = await this.prisma.marketRate.findMany({
            where: {
                cropName: { contains: cropKey, mode: 'insensitive' },
            },
            orderBy: { rateDate: 'desc' },
            take: 60,
        });
        const allSaleBills = await this.prisma.saleBill.findMany({
            orderBy: { createdAt: 'desc' },
            take: 60,
            select: {
                createdAt: true,
                items: true,
                farmer: { select: { state: true, district: true } },
            },
        });
        const localRatePool = [];
        const stateRatePool = [];
        const nationalRatePool = [];
        const matchesCrop = (targetName) => {
            if (!targetName)
                return false;
            const t = targetName.split('(')[0].trim().toLowerCase();
            if (t === cropKey || t.includes(cropKey) || cropKey.includes(t))
                return true;
            for (const [key, synonyms] of Object.entries(CROP_SYNONYMS)) {
                const matchesKey = key === cropKey || synonyms.includes(cropKey);
                const matchesTarget = synonyms.some((syn) => t.includes(syn) || syn.includes(t));
                if (matchesKey && matchesTarget)
                    return true;
            }
            return false;
        };
        for (const mr of allMarketRates) {
            if (matchesCrop(mr.cropName)) {
                const rate = normalizeToTargetUnit(Number(mr.modalPrice ?? mr.minPrice ?? mr.maxPrice), mr.unit, normalizedUnit);
                if (rate && rate > 0) {
                    nationalRatePool.push(rate);
                    const isState = mr.state && mr.state.toLowerCase() === targetState.toLowerCase();
                    if (isState) {
                        stateRatePool.push(rate);
                        localRatePool.push(rate);
                    }
                }
            }
        }
        for (const bill of allSaleBills) {
            const items = bill.items;
            if (Array.isArray(items)) {
                for (const it of items) {
                    if (matchesCrop(it.cropName || it.productName)) {
                        const rate = normalizeToTargetUnit(Number(it.rate || it.pricePerUnit), it.unit, normalizedUnit);
                        if (rate && rate > 0) {
                            nationalRatePool.push(rate);
                            const isState = bill.farmer?.state && bill.farmer.state.toLowerCase() === targetState.toLowerCase();
                            if (isState) {
                                stateRatePool.push(rate);
                                localRatePool.push(rate);
                            }
                        }
                    }
                }
            }
        }
        if (localRatePool.length === 0) {
            localRatePool.push(60, 80, 200, 39, 40, 70);
        }
        if (stateRatePool.length === 0) {
            stateRatePool.push(...localRatePool);
        }
        if (nationalRatePool.length === 0) {
            nationalRatePool.push(...stateRatePool, 88, 95, 220);
        }
        const localMin = Math.min(...localRatePool);
        const localMax = Math.max(...localRatePool);
        const localAvg = Math.round((localRatePool.reduce((a, b) => a + b, 0) / localRatePool.length) * 100) / 100;
        const freqMap = {};
        localRatePool.forEach((r) => { freqMap[r] = (freqMap[r] || 0) + 1; });
        let localModal = localRatePool[0];
        let maxFreq = 0;
        for (const [r, f] of Object.entries(freqMap)) {
            if (f > maxFreq) {
                maxFreq = f;
                localModal = Number(r);
            }
        }
        const stateMin = Math.min(...stateRatePool);
        const stateMax = Math.max(...stateRatePool);
        const stateAvg = Math.round((stateRatePool.reduce((a, b) => a + b, 0) / stateRatePool.length) * 100) / 100;
        const natMin = Math.min(...nationalRatePool);
        const natMax = Math.max(...nationalRatePool);
        const natAvg = Math.round((nationalRatePool.reduce((a, b) => a + b, 0) / nationalRatePool.length) * 100) / 100;
        return {
            success: true,
            cropName: englishCrop,
            category: 'Floriculture',
            unit: normalizedUnit,
            rates: {
                local: {
                    mandi: 'Firozpur & Local APMC',
                    state: targetState,
                    minRate: localMin,
                    maxRate: localMax,
                    avgRate: localAvg,
                    modalRate: localModal,
                    trend: 'UP',
                    change: '+₹12.50',
                    sampleCount: localRatePool.length,
                },
                state: {
                    stateName: targetState,
                    minRate: stateMin,
                    maxRate: stateMax,
                    avgRate: stateAvg,
                    sampleCount: stateRatePool.length,
                },
                national: {
                    hubName: 'Delhi Ghazipur & National Hubs',
                    minRate: natMin,
                    maxRate: natMax,
                    avgRate: natAvg,
                    sampleCount: nationalRatePool.length,
                },
            },
            weather: {
                temp: '24°C',
                condition: 'Sunny',
                humidity: '52%',
                windSpeed: '9 km/h',
                spraySafe: true,
                sprayAdvice: 'Safe to Spray Today (No Rain)',
            },
            deepLinks: {
                scanDoctor: 'farmsking://crop-disease-scanner',
                mandiRates: `farmsking://market?crop=${englishCrop.toLowerCase()}`,
                farmCare: 'farmsking://farm?tab=CROP_CARE',
            },
            updatedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            serverTimestamp: new Date().toISOString(),
        };
    }
};
exports.MarketRatesService = MarketRatesService;
exports.MarketRatesService = MarketRatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketRatesService);
function getUnitFamily(rawUnit) {
    if (!rawUnit)
        return 'WEIGHT';
    const u = rawUnit.trim().toUpperCase();
    if (['PIECE', 'PIECES', 'PCS', 'PC', 'NUM', 'NO', 'FLOWER', 'FLOWERS'].includes(u)) {
        return 'COUNT';
    }
    if (['DOZEN', 'DZ'].includes(u)) {
        return 'DOZEN';
    }
    if ([
        'KG',
        'KILOGRAM',
        'KILO',
        'QUINTAL',
        'QTL',
        'QNTL',
        'TON',
        'TONNE',
        'MANN',
        'MON',
        'GRAM',
        'GM',
        'BAG_50',
        'BAG_35',
        'BAG',
    ].some((w) => u.includes(w))) {
        return 'WEIGHT';
    }
    return u;
}
function getNormalizedDisplayUnit(rawUnit) {
    if (!rawUnit)
        return 'KG';
    const u = rawUnit.trim().toUpperCase();
    if (['PIECE', 'PIECES', 'PCS', 'PC', 'NUM', 'NO', 'FLOWER', 'FLOWERS'].includes(u)) {
        return 'PIECE';
    }
    if (['DOZEN', 'DZ'].includes(u)) {
        return 'DOZEN';
    }
    if (u.includes('QUINTAL') || u.includes('QTL')) {
        return 'QUINTAL';
    }
    if (u.includes('TON')) {
        return 'TON';
    }
    if (u.includes('MANN') || u.includes('MON')) {
        return 'MANN';
    }
    if (u.includes('GRAM') || u.includes('GM')) {
        return 'GRAM';
    }
    if (u.includes('KG') || u.includes('KILO')) {
        return 'KG';
    }
    return u;
}
function normalizeToTargetUnit(rawRate, itemUnit, targetUnit = 'KG') {
    if (isNaN(rawRate) || rawRate <= 0)
        return null;
    const itemFamily = getUnitFamily(itemUnit);
    const targetFamily = getUnitFamily(targetUnit);
    if (itemFamily !== targetFamily) {
        return null;
    }
    if (itemFamily === 'COUNT') {
        return rawRate;
    }
    if (itemFamily === 'DOZEN') {
        return rawRate;
    }
    if (itemFamily === 'WEIGHT') {
        const itemU = (itemUnit || 'KG').trim().toUpperCase();
        let perKg = rawRate;
        if (itemU.includes('QUINTAL') || itemU.includes('QTL')) {
            perKg = rawRate / 100;
        }
        else if (itemU.includes('50') || itemU.includes('BAG_50')) {
            perKg = rawRate / 50;
        }
        else if (itemU.includes('35') || itemU.includes('BAG_35')) {
            perKg = rawRate / 35;
        }
        else if (itemU.includes('40') || itemU.includes('MANN') || itemU.includes('MON')) {
            perKg = rawRate / 40;
        }
        else if (itemU.includes('TON')) {
            perKg = rawRate / 1000;
        }
        else if (itemU.includes('GRAM') || itemU.includes('GM')) {
            perKg = rawRate * 1000;
        }
        const targetU = targetUnit.trim().toUpperCase();
        if (targetU.includes('QUINTAL') || targetU.includes('QTL')) {
            return Math.round(perKg * 100 * 100) / 100;
        }
        if (targetU.includes('TON')) {
            return Math.round(perKg * 1000 * 100) / 100;
        }
        if (targetU.includes('MANN') || targetU.includes('MON')) {
            return Math.round(perKg * 40 * 100) / 100;
        }
        if (targetU.includes('GRAM') || targetU.includes('GM')) {
            return Math.round((perKg / 1000) * 100) / 100;
        }
        return Math.round(perKg * 100) / 100;
    }
    const normItem = (itemUnit || '').trim().toUpperCase();
    const normTarget = targetUnit.trim().toUpperCase();
    return normItem === normTarget ? rawRate : null;
}
const CROP_SYNONYMS = {
    rose: ['rose', 'gulab', 'ਗੁਲਾਬ', 'गुलाब'],
    marigold: ['marigold', 'genda', 'ਗੈਂਦਾ', 'गेंda'],
    wheat: ['wheat', 'kanak', 'gehu', 'ਕਣਕ', 'गेहूं'],
    paddy: ['paddy', 'rice', 'jona', 'dhan', 'ਝੋਨਾ', 'ਚਾਵਲ', 'धान'],
    tomato: ['tomato', 'tamatar', 'ਟਮਾਟਰ', 'टमाटर'],
    potato: ['potato', 'aloo', 'ਆਲੂ', 'आलू'],
    onion: ['onion', 'pyaz', 'ਪਿਆਜ਼', 'प्याज'],
    mustard: ['mustard', 'sarson', 'ਸਰ੍ਹੋਂ', 'सरसों'],
    cotton: ['cotton', 'narma', 'kapas', 'ਨਰਮਾ', 'ਕਪਾਹ', 'कपास'],
    maize: ['maize', 'makki', 'ਮੱਕੀ', 'मक्का'],
    sugarcane: ['sugarcane', 'ganna', 'kamaad', 'ਗੰਨਾ', 'ਕਮਾਦ', 'गन्ना'],
};
//# sourceMappingURL=market-rates.service.js.map