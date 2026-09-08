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
            where: { farmerId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const recentArhtiyaSales = await this.prisma.arhtiyaTransaction.findMany({
            where: { farmerId: user.id, type: 'CROP_SALE_CREDIT' },
            orderBy: { transactionDate: 'desc' },
            take: 20,
        });
        const rates = await Promise.all(distinctCrops.map(async ({ cropName, unit: cropUnit, pricePerUnit }) => {
            const [nationalAgg, localAgg] = await Promise.all([
                this.prisma.marketRate.aggregate({
                    where: { cropName: { equals: cropName, mode: 'insensitive' }, rateDate: { gte: since } },
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
                        _avg: { modalPrice: true },
                        _count: true,
                    })
                    : Promise.resolve(null),
            ]);
            let localAvgRate = localAgg?._avg.modalPrice ? Number(localAgg._avg.modalPrice) : null;
            let localSampleCount = localAgg?._count ?? 0;
            let unit = cropUnit || 'quintal';
            for (const bill of recentBills) {
                const items = bill.items;
                if (Array.isArray(items)) {
                    const matched = items.find((it) => {
                        const iName = (it.cropName || '').split('(')[0].trim().toLowerCase();
                        return iName === cropName.toLowerCase() || iName.includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(iName);
                    });
                    if (matched && Number(matched.rate) > 0) {
                        if (localAvgRate == null || bill.createdAt >= since) {
                            localAvgRate = Number(matched.rate);
                            localSampleCount = Math.max(localSampleCount, 1);
                            if (matched.unit)
                                unit = matched.unit;
                        }
                        break;
                    }
                }
            }
            if (localAvgRate == null) {
                const matchedArhtiya = recentArhtiyaSales.find((tx) => {
                    const tName = (tx.cropName || '').split('(')[0].trim().toLowerCase();
                    return tName === cropName.toLowerCase() || tName.includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(tName);
                });
                if (matchedArhtiya && Number(matchedArhtiya.ratePerQuintal) > 0) {
                    localAvgRate = Number(matchedArhtiya.ratePerQuintal);
                    localSampleCount = 1;
                    unit = matchedArhtiya.inputUnit || 'QUINTAL';
                }
            }
            if (localAvgRate == null && pricePerUnit != null && Number(pricePerUnit) > 0) {
                localAvgRate = Number(pricePerUnit);
                localSampleCount = 1;
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
            const nationalAvgRate = nationalAgg._avg.modalPrice ? Number(nationalAgg._avg.modalPrice) : localAvgRate;
            return {
                cropName,
                unit,
                localAvgRate,
                localSampleCount,
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