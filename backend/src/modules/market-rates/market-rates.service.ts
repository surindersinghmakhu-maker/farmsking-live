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

    const cropCycles = await this.prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        status: 'HARVESTING',
        plot: { deletedAt: null, farm: { deletedAt: null, ownerId: user.id } },
      },
      select: { cropName: true },
    });

    const distinctCropNames = [
      ...new Map(
        cropCycles.map((c) => {
          // Extract English name part: e.g. "Rose (गुलाब)" -> "Rose"
          const englishName = c.cropName.split('(')[0].trim();
          return [englishName.toLowerCase(), englishName];
        })
      ).values(),
    ];

    const since = new Date(Date.now() - ONE_DAY_MS);

    const rates = await Promise.all(
      distinctCropNames.map(async (cropName) => {
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

        const sample = await this.prisma.marketRate.findFirst({
          where: { cropName: { equals: cropName, mode: 'insensitive' } },
          orderBy: { rateDate: 'desc' },
          select: { unit: true },
        });

        return {
          cropName,
          unit: sample?.unit ?? 'quintal',
          localAvgRate: localAgg?._avg.modalPrice ? Number(localAgg._avg.modalPrice) : null,
          localSampleCount: localAgg?._count ?? 0,
          nationalAvgRate: nationalAgg._avg.modalPrice ? Number(nationalAgg._avg.modalPrice) : null,
          nationalSampleCount: nationalAgg._count,
        };
      }),
    );

    return { state: profile?.state ?? null, rates };
  }
}
