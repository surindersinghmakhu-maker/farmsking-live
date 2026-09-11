import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface CropRateSummary {
  cropName: string;
  unit: string;
  localMinRate: number | null;
  localMaxRate: number | null;
  localAvgRate: number | null;
  localSampleCount: number;
  nationalMinRate: number | null;
  nationalMaxRate: number | null;
  nationalAvgRate: number | null;
  nationalSampleCount: number;
}

@Injectable()
export class MarketRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCropRates(user: AuthUser): Promise<{ state: string | null; rates: CropRateSummary[] }> {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { state: true },
    });

    const userState = (profile?.state || 'Punjab').trim();

    // 1. Fetch user's active crops in HARVESTING or ACTIVE stage
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

    const distinctCropMap = new Map<string, { cropName: string; unit?: string | null }>();
    for (const c of cropCycles) {
      const englishName = c.cropName.split('(')[0].trim();
      const key = englishName.toLowerCase();
      if (!distinctCropMap.has(key)) {
        distinctCropMap.set(key, { cropName: englishName, unit: c.unit });
      }
    }

    // Fallback: If user has 0 crops registered, populate from recent market rates or default crops
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
      } catch {
        // ignore fallback error
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

    // 2. Fetch all SaleItems recorded across the app in the last 24 hours
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

    // 3. Fetch all SaleBills recorded across the app in the last 24 hours
    const recentSaleBills = await this.prisma.saleBill.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        items: true,
        farmer: { select: { state: true } },
      },
    });

    // 4. Fetch all Arhtiya crop sales in the last 24 hours
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

    // 5. Fetch MarketRate records updated in the last 24 hours
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

    const rates = await Promise.all(
      distinctCrops.map(async ({ cropName, unit: cropUnit }) => {
        const cropKey = cropName.toLowerCase();
        let unit = cropUnit || 'quintal';

        const localRatePool: number[] = [];
        const nationalRatePool: number[] = [];

        // Helper to check if crop name matches
        const matchesCrop = (targetName: string) => {
          const t = (targetName || '').split('(')[0].trim().toLowerCase();
          return t === cropKey || t.includes(cropKey) || cropKey.includes(t);
        };

        // Helper to check if state matches user's state
        const isUserState = (st?: string | null) => {
          if (!st || !userState) return false;
          return st.trim().toLowerCase() === userState.toLowerCase();
        };

        // Helper to check item timestamp is strictly within last 24 hrs
        const isWithin24h = (dt?: Date | string | null) => {
          if (!dt) return true; // Fallback if bill is already filtered by 24h gte
          const t = new Date(dt).getTime();
          return !isNaN(t) && t >= sinceTime;
        };

        // A) Process SaleItems
        for (const item of recentSaleItems) {
          if (matchesCrop(item.productName) && isWithin24h(item.createdAt)) {
            const rVal = Number(item.pricePerUnit);
            if (!isNaN(rVal) && rVal > 0) {
              nationalRatePool.push(rVal);
              if (isUserState(item.sale?.recordedBy?.state)) {
                localRatePool.push(rVal);
              }
              if (item.unit) unit = item.unit;
            }
          }
        }

        // B) Process SaleBills and Sale Item JSON array timestamps
        for (const bill of recentSaleBills) {
          const items = bill.items as any[];
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
                    if (it.unit) unit = it.unit;
                  }
                }
              }
            }
          }
        }

        // C) Process Arhtiya Transactions
        for (const tx of recentArhtiyaSales) {
          if (tx.cropName && matchesCrop(tx.cropName) && isWithin24h(tx.transactionDate)) {
            const rVal = Number(tx.ratePerQuintal);
            if (!isNaN(rVal) && rVal > 0) {
              nationalRatePool.push(rVal);
              if (isUserState(tx.farmer?.state)) {
                localRatePool.push(rVal);
              }
              if (tx.inputUnit) unit = tx.inputUnit;
            }
          }
        }

        // D) Process MarketRate table entries
        for (const mr of recentMarketRates) {
          if (matchesCrop(mr.cropName) && isWithin24h(mr.rateDate)) {
            const minP = Number(mr.minPrice ?? mr.modalPrice);
            const maxP = Number(mr.maxPrice ?? mr.modalPrice);
            const avgP = Number(mr.modalPrice);

            if (!isNaN(minP) && minP > 0) nationalRatePool.push(minP);
            if (!isNaN(maxP) && maxP > 0) nationalRatePool.push(maxP);
            if (!isNaN(avgP) && avgP > 0) nationalRatePool.push(avgP);

            if (isUserState(mr.state)) {
              if (!isNaN(minP) && minP > 0) localRatePool.push(minP);
              if (!isNaN(maxP) && maxP > 0) localRatePool.push(maxP);
              if (!isNaN(avgP) && avgP > 0) localRatePool.push(avgP);
            }

            if (mr.unit) unit = mr.unit;
          }
        }

        // Compute State (Local) Level Min, Max, Avg rates
        let localMinRate: number | null = null;
        let localMaxRate: number | null = null;
        let localAvgRate: number | null = null;

        if (localRatePool.length > 0) {
          localMinRate = Math.min(...localRatePool);
          localMaxRate = Math.max(...localRatePool);
          localAvgRate = Math.round(localRatePool.reduce((a, b) => a + b, 0) / localRatePool.length);
        }

        // Compute National Level Min, Max, Avg rates
        let nationalMinRate: number | null = null;
        let nationalMaxRate: number | null = null;
        let nationalAvgRate: number | null = null;

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
      }),
    );

    return { state: userState, rates };
  }
}
