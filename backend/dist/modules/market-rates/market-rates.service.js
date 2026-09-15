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
    }
    async getMyCropRates(user) {
        const profile = user?.id
            ? await this.prisma.user.findUnique({
                where: { id: user.id },
                select: { state: true },
            })
            : null;
        const userState = (profile?.state || 'Punjab').trim();
        const since = new Date(Date.now() - ONE_DAY_MS);
        const sinceTime = since.getTime();
        let cropCycles = [];
        if (user?.id) {
            cropCycles = await this.prisma.cropCycle.findMany({
                where: {
                    deletedAt: null,
                    status: { in: ['HARVESTING', 'ACTIVE'] },
                    plot: { deletedAt: null, farm: { deletedAt: null, ownerId: user.id } },
                },
                select: { cropName: true, unit: true, pricePerUnit: true },
            });
            if (cropCycles.length === 0) {
                cropCycles = await this.prisma.cropCycle.findMany({
                    where: {
                        deletedAt: null,
                        plot: { deletedAt: null, farm: { deletedAt: null, ownerId: user.id } },
                    },
                    select: { cropName: true, unit: true, pricePerUnit: true },
                });
            }
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
                const key = englishName.toLowerCase();
                if (!distinctCropMap.has(key)) {
                    distinctCropMap.set(key, { cropName: englishName, unit: c.unit });
                }
            }
        }
        const distinctCrops = Array.from(distinctCropMap.values());
        function normalizeToPerKg(rawRate, rawUnit) {
            if (isNaN(rawRate) || rawRate <= 0)
                return 0;
            const u = (rawUnit || 'KG').toUpperCase();
            if (u.includes('QUINTAL') || u.includes('QTL')) {
                return rawRate / 100;
            }
            if (u.includes('50') || u.includes('BAG_50')) {
                return rawRate / 50;
            }
            if (u.includes('35') || u.includes('BAG_35')) {
                return rawRate / 35;
            }
            if (u.includes('40') || u.includes('MANN')) {
                return rawRate / 40;
            }
            if (u.includes('TON')) {
                return rawRate / 1000;
            }
            if (u.includes('GRAM') || u.includes('GM')) {
                return rawRate * 1000;
            }
            return rawRate;
        }
        const CROP_SYNONYMS = {
            rose: ['rose', 'gulab', 'ਗੁਲਾਬ', 'गुलाब'],
            marigold: ['marigold', 'genda', 'ਗੈਂਦਾ', 'गेंदा'],
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
        const rates = await Promise.all(distinctCrops.map(async ({ cropName, unit: cropUnit }) => {
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
                    const perKg = normalizeToPerKg(Number(item.pricePerUnit), item.unit);
                    if (perKg > 0) {
                        nationalRatePool.push(perKg);
                        if (isUserState(item.sale?.recordedBy?.state)) {
                            localRatePool.push(perKg);
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
                                const perKg = normalizeToPerKg(Number(it.rate || it.pricePerUnit), it.unit);
                                if (perKg > 0) {
                                    nationalRatePool.push(perKg);
                                    if (isUserState(bill.farmer?.state)) {
                                        localRatePool.push(perKg);
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
                    const avgPerKg = normalizeToPerKg(Number(mr.modalPrice ?? mr.minPrice ?? mr.maxPrice), mr.unit);
                    if (avgPerKg > 0) {
                        nationalRatePool.push(avgPerKg);
                        if (isUserState(mr.state)) {
                            localRatePool.push(avgPerKg);
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
                unit: 'KG',
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
        return { state: userState, rates };
    }
};
exports.MarketRatesService = MarketRatesService;
exports.MarketRatesService = MarketRatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketRatesService);
//# sourceMappingURL=market-rates.service.js.map