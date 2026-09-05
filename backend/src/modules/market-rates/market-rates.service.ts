import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface CropRateSummary {
  cropName: string;
  unit: string;
  localAvgRate: number | null;
  localSampleCount: number;
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

    const distinctCropMap = new Map<string, { cropName: string; unit?: string | null; pricePerUnit?: any }>();
    for (const c of cropCycles) {
      const englishName = c.cropName.split('(')[0].trim();
      const key = englishName.toLowerCase();
      if (!distinctCropMap.has(key)) {
        distinctCropMap.set(key, { cropName: englishName, unit: c.unit, pricePerUnit: c.pricePerUnit });
      }
    }

    const distinctCrops = Array.from(distinctCropMap.values());
    const since = new Date(Date.now() - ONE_DAY_MS);

    // Fetch user's recent sale bills for sales rate extraction
    const recentBills = await this.prisma.saleBill.findMany({
      where: { farmerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Fetch user's recent Arhtiya crop sales
    const recentArhtiyaSales = await this.prisma.arhtiyaTransaction.findMany({
      where: { farmerId: user.id, type: 'CROP_SALE_CREDIT' },
      orderBy: { transactionDate: 'desc' },
      take: 20,
    });

    const rates = await Promise.all(
      distinctCrops.map(async ({ cropName, unit: cropUnit, pricePerUnit }) => {
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

        // 1. Check recent SaleBills for this user and crop (prioritize recent sales within 24 hrs or latest sale)
        for (const bill of recentBills) {
          const items = bill.items as any[];
          if (Array.isArray(items)) {
            const matched = items.find((it) => {
              const iName = (it.cropName || '').split('(')[0].trim().toLowerCase();
              return iName === cropName.toLowerCase() || iName.includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(iName);
            });
            if (matched && Number(matched.rate) > 0) {
              if (localAvgRate == null || bill.createdAt >= since) {
                localAvgRate = Number(matched.rate);
                localSampleCount = Math.max(localSampleCount, 1);
                if (matched.unit) unit = matched.unit;
              }
              break;
            }
          }
        }

        // 2. Check recent Arhtiya crop sales for this user and crop
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

        // 3. Fallback to cropCycle pricePerUnit
        if (localAvgRate == null && pricePerUnit != null && Number(pricePerUnit) > 0) {
          localAvgRate = Number(pricePerUnit);
          localSampleCount = 1;
        }

        // 4. Sample MarketRate for unit info if not yet determined
        if (!unit || unit === 'quintal') {
          const sample = await this.prisma.marketRate.findFirst({
            where: { cropName: { equals: cropName, mode: 'insensitive' } },
            orderBy: { rateDate: 'desc' },
            select: { unit: true },
          });
          if (sample?.unit) unit = sample.unit;
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
      }),
    );

    return { state: profile?.state ?? null, rates };
  }
}

