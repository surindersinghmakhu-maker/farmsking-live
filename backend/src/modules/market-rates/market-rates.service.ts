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

const CROP_ENGLISH_MAP: Record<string, string> = {
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

export function toEnglishCropName(rawName: string): string {
  if (!rawName) return '';
  const cleaned = rawName.split('(')[0].trim();
  const key = cleaned.toLowerCase();
  if (CROP_ENGLISH_MAP[key]) return CROP_ENGLISH_MAP[key];
  for (const [k, english] of Object.entries(CROP_ENGLISH_MAP)) {
    if (key.includes(k) || k.includes(key)) {
      return english;
    }
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

@Injectable()
export class MarketRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCropRates(user?: AuthUser | null): Promise<{ state: string | null; rates: CropRateSummary[] }> {
    const profile = user?.id
      ? await this.prisma.user.findUnique({
          where: { id: user.id },
          select: { state: true },
        })
      : null;

    const userState = (profile?.state || 'Punjab').trim();

    const since = new Date(Date.now() - ONE_DAY_MS);
    const sinceTime = since.getTime();

    // 1. Fetch user's active crops in HARVESTING or ACTIVE stage
    let cropCycles: any[] = [];
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

    // 4. Fetch MarketRate records updated in the last 24 hours (excluding Arhtiya sales)
    const recentMarketRates = await this.prisma.marketRate.findMany({
      where: {
        rateDate: { gte: since },
        NOT: { source: 'arhtiya_crop_sale' },
      },
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

    // Collect ALL unique crops from user's registered crops + 24h sale bills + 24h sale items + 24h market rates + default crops
    const distinctCropMap = new Map<string, { cropName: string; unit?: string | null }>();

    for (const c of cropCycles) {
      if (c.cropName) {
        const englishName = toEnglishCropName(c.cropName);
        const key = englishName.toLowerCase();
        if (!distinctCropMap.has(key)) {
          distinctCropMap.set(key, { cropName: englishName, unit: c.unit });
        }
      }
    }

    for (const bill of recentSaleBills) {
      const items = bill.items as any[];
      if (Array.isArray(items)) {
        for (const it of items) {
          const rawName = it.cropName || it.productName;
          if (rawName) {
            const englishName = toEnglishCropName(rawName);
            const key = englishName.toLowerCase();
            if (!distinctCropMap.has(key)) {
              distinctCropMap.set(key, { cropName: englishName, unit: it.unit || 'KG' });
            }
          }
        }
      }
    }

    for (const item of recentSaleItems) {
      if (item.productName) {
        const englishName = toEnglishCropName(item.productName);
        const key = englishName.toLowerCase();
        if (!distinctCropMap.has(key)) {
          distinctCropMap.set(key, { cropName: englishName, unit: item.unit || 'KG' });
        }
      }
    }

    for (const mr of recentMarketRates) {
      if (mr.cropName) {
        const englishName = toEnglishCropName(mr.cropName);
        const key = englishName.toLowerCase();
        if (!distinctCropMap.has(key)) {
          distinctCropMap.set(key, { cropName: englishName, unit: mr.unit || 'KG' });
        }
      }
    }

    const defaultCrops = [
      { cropName: 'Rose', unit: 'KG' },
      { cropName: 'Marigold', unit: 'KG' },
      { cropName: 'Wheat', unit: 'Quintal' },
      { cropName: 'Paddy', unit: 'Quintal' },
    ];
    for (const dc of defaultCrops) {
      const key = dc.cropName.toLowerCase();
      if (!distinctCropMap.has(key)) {
        distinctCropMap.set(key, dc);
      }
    }

    const distinctCrops = Array.from(distinctCropMap.values());

function normalizeToPerKg(rawRate: number, rawUnit?: string | null): number {
  if (isNaN(rawRate) || rawRate <= 0) return 0;
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

const CROP_SYNONYMS: Record<string, string[]> = {
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

    const rates = await Promise.all(
      distinctCrops.map(async ({ cropName, unit: cropUnit }) => {
        const cropKey = cropName.toLowerCase().split('(')[0].trim();

        const localRatePool: number[] = [];
        const nationalRatePool: number[] = [];

        // Helper to check if crop name matches (supports English, Punjabi, Hindi synonyms)
        const matchesCrop = (targetName: string) => {
          if (!targetName) return false;
          const t = targetName.split('(')[0].trim().toLowerCase();
          if (t === cropKey || t.includes(cropKey) || cropKey.includes(t)) return true;

          // Check synonyms
          for (const [key, synonyms] of Object.entries(CROP_SYNONYMS)) {
            const matchesKey = key === cropKey || synonyms.includes(cropKey);
            const matchesTarget = synonyms.some((syn) => t.includes(syn) || syn.includes(t));
            if (matchesKey && matchesTarget) return true;
          }
          return false;
        };

        // Helper to check if state matches user's state (fallback to true if unspecified)
        const isUserState = (st?: string | null) => {
          if (!st || !userState) return true;
          return st.trim().toLowerCase() === userState.toLowerCase();
        };

        // Helper to check item timestamp is strictly within last 24 hrs
        const isWithin24h = (dt?: Date | string | null) => {
          if (!dt) return true; // Fallback to bill creation time which is already >= since
          const t = new Date(dt).getTime();
          return !isNaN(t) && t >= sinceTime;
        };

        // A) Process SaleItems (recorded within last 24h)
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

        // B) Process SaleBills and Sale Item JSON array timestamps
        for (const bill of recentSaleBills) {
          const items = bill.items as any[];
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

        // C) Process MarketRate table entries
        for (const mr of recentMarketRates) {
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

        // Compute State (Local) Level Min, Max, Avg rates (per-KG)
        let localMinRate: number | null = null;
        let localMaxRate: number | null = null;
        let localAvgRate: number | null = null;

        if (localRatePool.length > 0) {
          localMinRate = Math.min(...localRatePool);
          localMaxRate = Math.max(...localRatePool);
          localAvgRate = (localMinRate + localMaxRate) / 2;
        }

        // Compute National Level Min, Max, Avg rates (per-KG)
        let nationalMinRate: number | null = null;
        let nationalMaxRate: number | null = null;
        let nationalAvgRate: number | null = null;

        if (nationalRatePool.length > 0) {
          nationalMinRate = Math.min(...nationalRatePool);
          nationalMaxRate = Math.max(...nationalRatePool);
          nationalAvgRate = (nationalMinRate + nationalMaxRate) / 2;
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
      }),
    );

    return { state: userState, rates };
  }
}
