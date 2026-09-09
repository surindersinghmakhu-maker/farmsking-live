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
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
let MarketRatesService = class MarketRatesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyCropRates(user) {
        const profile = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { state: true },
        });
        let cropCycles = await this.prisma.cropCycle.findMany({
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
        const distinctCropMap = new Map();
        for (const c of cropCycles) {
            const englishName = c.cropName.split('(')[0].trim();
            const key = englishName.toLowerCase();
            if (!distinctCropMap.has(key)) {
                distinctCropMap.set(key, { cropName: englishName, unit: c.unit, pricePerUnit: c.pricePerUnit });
            }
        }
        const distinctCrops = Array.from(distinctCropMap.values());
        const since = new Date(Date.now() - ONE_DAY_MS);
        const recentBills = await this.prisma.saleBill.findMany({
            where: { farmerId: user.id, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const recentArhtiyaSales = await this.prisma.arhtiyaTransaction.findMany({
            where: { farmerId: user.id, type: 'CROP_SALE_CREDIT', transactionDate: { gte: since } },
            orderBy: { transactionDate: 'desc' },
            take: 20,
        });
        const rates = await Promise.all(distinctCrops.map(async ({ cropName, unit: cropUnit }) => {
            const [nationalAgg, localAgg] = await Promise.all([
                this.prisma.marketRate.aggregate({
                    where: { cropName: { equals: cropName, mode: 'insensitive' }, rateDate: { gte: since } },
                    _min: { minPrice: true, modalPrice: true },
                    _max: { maxPrice: true, modalPrice: true },
                    _avg: { modalPrice: true },
                    _count: true,
                }),
                profile?.state
                    ? this.prisma.marketRate.aggregate({
                        where: {
                            cropName: { equals: cropName, mode: 'insensitive' },
                            rateDate: { gte: since },
                            state: { equals: profile.state, mode: 'insensitive' },
                        },
                        _min: { minPrice: true, modalPrice: true },
                        _max: { maxPrice: true, modalPrice: true },
                        _avg: { modalPrice: true },
                        _count: true,
                    })
                    : Promise.resolve(null),
            ]);
            const localRatePool = [];
            let unit = cropUnit || 'quintal';
            if (localAgg && localAgg._count > 0) {
                const minP = Number(localAgg._min.minPrice ?? localAgg._min.modalPrice);
                const maxP = Number(localAgg._max.maxPrice ?? localAgg._max.modalPrice);
                const avgP = Number(localAgg._avg.modalPrice);
                if (!isNaN(minP) && minP > 0)
                    localRatePool.push(minP);
                if (!isNaN(maxP) && maxP > 0)
                    localRatePool.push(maxP);
                if (!isNaN(avgP) && avgP > 0)
                    localRatePool.push(avgP);
            }
            for (const bill of recentBills) {
                const items = bill.items;
                if (Array.isArray(items)) {
                    for (const it of items) {
                        const iName = (it.cropName || '').split('(')[0].trim().toLowerCase();
                        if (iName === cropName.toLowerCase() || iName.includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(iName)) {
                            const rVal = Number(it.rate);
                            if (rVal > 0) {
                                localRatePool.push(rVal);
                                if (it.unit)
                                    unit = it.unit;
                            }
                        }
                    }
                }
            }
            for (const tx of recentArhtiyaSales) {
                const tName = (tx.cropName || '').split('(')[0].trim().toLowerCase();
                if (tName === cropName.toLowerCase() || tName.includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(tName)) {
                    const rVal = Number(tx.ratePerQuintal);
                    if (rVal > 0) {
                        localRatePool.push(rVal);
                        if (tx.inputUnit)
                            unit = tx.inputUnit;
                    }
                }
            }
            if (!unit || unit === 'quintal') {
                const sample = await this.prisma.marketRate.findFirst({
                    where: { cropName: { equals: cropName, mode: 'insensitive' } },
                    orderBy: { rateDate: 'desc' },
                    select: { unit: true },
                });
                if (sample?.unit)
                    unit = sample.unit;
            }
            let localMinRate = null;
            let localMaxRate = null;
            let localAvgRate = null;
            if (localRatePool.length > 0) {
                localMinRate = Math.min(...localRatePool);
                localMaxRate = Math.max(...localRatePool);
                localAvgRate = Math.round(localRatePool.reduce((a, b) => a + b, 0) / localRatePool.length);
            }
            let nationalMinRate = null;
            let nationalMaxRate = null;
            let nationalAvgRate = null;
            if (nationalAgg._count && nationalAgg._count > 0) {
                const minNat = Number(nationalAgg._min.minPrice ?? nationalAgg._min.modalPrice);
                const maxNat = Number(nationalAgg._max.maxPrice ?? nationalAgg._max.modalPrice);
                const avgNat = Number(nationalAgg._avg.modalPrice);
                nationalMinRate = !isNaN(minNat) && minNat > 0 ? minNat : null;
                nationalMaxRate = !isNaN(maxNat) && maxNat > 0 ? maxNat : null;
                nationalAvgRate = !isNaN(avgNat) && avgNat > 0 ? Math.round(avgNat) : null;
            }
            else if (localRatePool.length > 0) {
                nationalMinRate = localMinRate;
                nationalMaxRate = localMaxRate;
                nationalAvgRate = localAvgRate;
            }
            return {
                cropName,
                unit,
                localMinRate,
                localMaxRate,
                localAvgRate,
                localSampleCount: localRatePool.length,
                nationalMinRate,
                nationalMaxRate,
                nationalAvgRate,
                nationalSampleCount: nationalAgg._count,
            };
        }));
        return { state: profile?.state ?? null, rates };
    }
};
exports.MarketRatesService = MarketRatesService;
exports.MarketRatesService = MarketRatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketRatesService);
//# sourceMappingURL=market-rates.service.js.map