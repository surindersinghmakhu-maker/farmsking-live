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
        const userState = (profile?.state || 'Punjab').trim();
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
                distinctCropMap.set(key, { cropName: englishName, unit: c.unit });
            }
        }
        if (distinctCropMap.size === 0) {
            try {
                const recentMR = await this.prisma.marketRate.findMany({
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    select: { cropName: true, unit: true },
                });
                for (const mr of recentMR) {
                    if (mr.cropName) {
                        const englishName = mr.cropName.split('(')[0].trim();
                        const key = englishName.toLowerCase();
                        if (!distinctCropMap.has(key)) {
                            distinctCropMap.set(key, { cropName: englishName, unit: mr.unit });
                        }
                    }
                }
            }
            catch {
            }
        }
        if (distinctCropMap.size === 0) {
            const defaultCrops = [
                { cropName: 'Rose', unit: 'KG' },
                { cropName: 'Marigold', unit: 'KG' },
                { cropName: 'Wheat', unit: 'Quintal' },
                { cropName: 'Paddy', unit: 'Quintal' },
            ];
            for (const dc of defaultCrops) {
                distinctCropMap.set(dc.cropName.toLowerCase(), dc);
            }
        }
        const distinctCrops = Array.from(distinctCropMap.values());
        const since = new Date(Date.now() - ONE_DAY_MS);
        const sinceTime = since.getTime();
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
        const recentArhtiyaSales = await this.prisma.arhtiyaTransaction.findMany({
            where: { transactionDate: { gte: since } },
            select: {
                cropName: true,
                inputUnit: true,
                ratePerQuintal: true,
                transactionDate: true,
                farmer: { select: { state: true } },
            },
        });
        const recentMarketRates = await this.prisma.marketRate.findMany({
            where: { rateDate: { gte: since } },
            select: {
                cropName: true,
                unit: true,
                minPrice: true,
                maxPrice: true,
                modalPrice: true,
                rateDate: true,
                state: true,
            },
        });
        const rates = await Promise.all(distinctCrops.map(async ({ cropName, unit: cropUnit }) => {
            const cropKey = cropName.toLowerCase();
            let unit = cropUnit || 'quintal';
            const localRatePool = [];
            const nationalRatePool = [];
            const matchesCrop = (targetName) => {
                const t = (targetName || '').split('(')[0].trim().toLowerCase();
                return t === cropKey || t.includes(cropKey) || cropKey.includes(t);
            };
            const isUserState = (st) => {
                if (!st || !userState)
                    return false;
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
                    const rVal = Number(item.pricePerUnit);
                    if (!isNaN(rVal) && rVal > 0) {
                        nationalRatePool.push(rVal);
                        if (isUserState(item.sale?.recordedBy?.state)) {
                            localRatePool.push(rVal);
                        }
                        if (item.unit)
                            unit = item.unit;
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
                                const rVal = Number(it.rate || it.pricePerUnit);
                                if (!isNaN(rVal) && rVal > 0) {
                                    nationalRatePool.push(rVal);
                                    if (isUserState(bill.farmer?.state)) {
                                        localRatePool.push(rVal);
                                    }
                                    if (it.unit)
                                        unit = it.unit;
                                }
                            }
                        }
                    }
                }
            }
            for (const tx of recentArhtiyaSales) {
                if (tx.cropName && matchesCrop(tx.cropName) && isWithin24h(tx.transactionDate)) {
                    const rVal = Number(tx.ratePerQuintal);
                    if (!isNaN(rVal) && rVal > 0) {
                        nationalRatePool.push(rVal);
                        if (isUserState(tx.farmer?.state)) {
                            localRatePool.push(rVal);
                        }
                        if (tx.inputUnit)
                            unit = tx.inputUnit;
                    }
                }
            }
            for (const mr of recentMarketRates) {
                if (matchesCrop(mr.cropName) && isWithin24h(mr.rateDate)) {
                    const minP = Number(mr.minPrice ?? mr.modalPrice);
                    const maxP = Number(mr.maxPrice ?? mr.modalPrice);
                    const avgP = Number(mr.modalPrice);
                    if (!isNaN(minP) && minP > 0)
                        nationalRatePool.push(minP);
                    if (!isNaN(maxP) && maxP > 0)
                        nationalRatePool.push(maxP);
                    if (!isNaN(avgP) && avgP > 0)
                        nationalRatePool.push(avgP);
                    if (isUserState(mr.state)) {
                        if (!isNaN(minP) && minP > 0)
                            localRatePool.push(minP);
                        if (!isNaN(maxP) && maxP > 0)
                            localRatePool.push(maxP);
                        if (!isNaN(avgP) && avgP > 0)
                            localRatePool.push(avgP);
                    }
                    if (mr.unit)
                        unit = mr.unit;
                }
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
            if (nationalRatePool.length > 0) {
                nationalMinRate = Math.min(...nationalRatePool);
                nationalMaxRate = Math.max(...nationalRatePool);
                nationalAvgRate = Math.round(nationalRatePool.reduce((a, b) => a + b, 0) / nationalRatePool.length);
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