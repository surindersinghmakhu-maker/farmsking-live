import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
// Updated MarketRatesCard component with fixed syntax and inline unit layout
import { Ionicons } from '@expo/vector-icons';
import { useMyCropRates } from '../hooks/useMarketRates';
import { useAuth } from '../store/auth-context';
import { formatInr } from '../utils/formatInr';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';

const theme = RoleThemes.FARMER;

export interface HarvestingCropRateItem {
  cropName: string;
  categoryName: string;
  stage: 'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED' | 'SOWING' | 'GROWTH';
  unit: string;
  localAvgRate: number;
  nationalAvgRate: number;
  trend: 'UP' | 'STABLE' | 'DOWN';
  trendDiff: string;
  harvestType: 'CONTINUOUS' | 'ONE_TIME';
}

const DEFAULT_HARVESTING_CROPS_RATES: HarvestingCropRateItem[] = [
  {
    cropName: 'Rose',
    categoryName: 'Flowers & Floriculture',
    stage: 'HARVESTING',
    unit: 'Bunch',
    localAvgRate: 44,
    nationalAvgRate: 40,
    trend: 'UP',
    trendDiff: '+₹4 (Up)',
    harvestType: 'CONTINUOUS',
  },
  {
    cropName: 'Wheat',
    categoryName: 'Cereals & Grains',
    stage: 'HARVESTING',
    unit: 'Quintal',
    localAvgRate: 2412,
    nationalAvgRate: 2275,
    trend: 'UP',
    trendDiff: '+₹137 (Up)',
    harvestType: 'ONE_TIME',
  },
  {
    cropName: 'Tomato',
    categoryName: 'Vegetables',
    stage: 'HARVESTING',
    unit: 'KG',
    localAvgRate: 34,
    nationalAvgRate: 30,
    trend: 'UP',
    trendDiff: '+₹4 (Up)',
    harvestType: 'CONTINUOUS',
  },
  {
    cropName: 'Marigold',
    categoryName: 'Flowers & Floriculture',
    stage: 'HARVESTING',
    unit: 'KG',
    localAvgRate: 65,
    nationalAvgRate: 60,
    trend: 'UP',
    trendDiff: '+₹5 (Up)',
    harvestType: 'CONTINUOUS',
  },
];

import { useMemo } from 'react';
import { useCrops } from '../store/crops-context';

/**
 * Convert base rate between measurement units (e.g. KG, Quintal, 50KG Bag, Grams, Tonne).
 */
function convertRateForCropUnit(rawRate: number, sourceUnit: string, targetUnit: string): number {
  const src = (sourceUnit || 'KG').toUpperCase();
  const tgt = (targetUnit || 'KG').toUpperCase();

  if (src === tgt) return Math.round(rawRate);

  // Normalize source rate to per-KG rate
  let perKg = rawRate;
  if (src.includes('QUINTAL') || src.includes('QTL')) {
    perKg = rawRate / 100;
  } else if (src.includes('50') || src.includes('BAG_50')) {
    perKg = rawRate / 50;
  } else if (src.includes('35') || src.includes('BAG_35')) {
    perKg = rawRate / 35;
  } else if (src.includes('40') || src.includes('MANN')) {
    perKg = rawRate / 40;
  } else if (src.includes('TON')) {
    perKg = rawRate / 1000;
  } else if (src.includes('GRAM') || src.includes('GM')) {
    perKg = rawRate * 1000;
  }

  // Convert per-KG rate to target crop measurement unit
  if (tgt.includes('QUINTAL') || tgt.includes('QTL')) {
    return Math.round(perKg * 100);
  }
  if (tgt.includes('50') || tgt.includes('BAG_50')) {
    return Math.round(perKg * 50);
  }
  if (tgt.includes('35') || tgt.includes('BAG_35')) {
    return Math.round(perKg * 35);
  }
  if (tgt.includes('40') || tgt.includes('MANN')) {
    return Math.round(perKg * 40);
  }
  if (tgt.includes('TON')) {
    return Math.round(perKg * 1000);
  }
  if (tgt.includes('GRAM') || tgt.includes('GM')) {
    return Math.round((perKg / 1000) * 100) / 100;
  }
  if (tgt.includes('KG')) {
    return Math.round(perKg);
  }

  return Math.round(rawRate);
}

export function MarketRatesCard() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useMyCropRates();
  const { cropFields } = useCrops();

  const userState = user?.state || data?.state || 'Punjab';

  // Filter user's active crops in HARVESTING stage (or active crops fallback).
  // Show SUBCATEGORY-WISE rates (base crop name) WITHOUT variety, converted per crop's measurement unit!
  const subcategoryRates = useMemo(() => {
    let harvestingCrops = cropFields.filter((c) => c.status === 'ACTIVE' && c.stage === 'HARVESTING');
    if (harvestingCrops.length === 0) {
      harvestingCrops = cropFields.filter((c) => c.status === 'ACTIVE');
    }

    const subcategoryMap = new Map<string, (typeof harvestingCrops)[0]>();

    for (const crop of harvestingCrops) {
      let baseName = crop.cropName.split('(')[0].trim();
      if (crop.variety && baseName.toLowerCase().includes(crop.variety.toLowerCase())) {
        baseName = baseName.replace(new RegExp(crop.variety, 'gi'), '').trim();
      }
      const key = baseName.toLowerCase();
      if (!subcategoryMap.has(key)) {
        subcategoryMap.set(key, crop);
      }
    }

    const uniqueSubcategoryCrops = Array.from(subcategoryMap.values());

    return uniqueSubcategoryCrops.map((userCrop) => {
      let displayTitle = userCrop.cropName.split('(')[0].trim();
      if (userCrop.variety && displayTitle.toLowerCase().includes(userCrop.variety.toLowerCase())) {
        displayTitle = displayTitle.replace(new RegExp(userCrop.variety, 'gi'), '').trim();
      }
      const userCropEng = displayTitle.toLowerCase();

      // Find matching rate from backend API data for last 24 hrs
      const apiRate = data?.rates?.find((r) => {
        const rName = r.cropName.split('(')[0].trim().toLowerCase();
        return rName === userCropEng || rName.includes(userCropEng) || userCropEng.includes(rName);
      });

      const sourceUnit = apiRate?.unit || 'KG';
      const targetUnit = userCrop.unit || sourceUnit;

      const localMinRate =
        apiRate?.localMinRate != null && apiRate.localMinRate > 0
          ? convertRateForCropUnit(apiRate.localMinRate, sourceUnit, targetUnit)
          : null;

      const localMaxRate =
        apiRate?.localMaxRate != null && apiRate.localMaxRate > 0
          ? convertRateForCropUnit(apiRate.localMaxRate, sourceUnit, targetUnit)
          : null;

      const localAvgRate =
        apiRate?.localAvgRate != null && apiRate.localAvgRate > 0
          ? convertRateForCropUnit(apiRate.localAvgRate, sourceUnit, targetUnit)
          : null;

      const nationalMinRate =
        apiRate?.nationalMinRate != null && apiRate.nationalMinRate > 0
          ? convertRateForCropUnit(apiRate.nationalMinRate, sourceUnit, targetUnit)
          : null;

      const nationalMaxRate =
        apiRate?.nationalMaxRate != null && apiRate.nationalMaxRate > 0
          ? convertRateForCropUnit(apiRate.nationalMaxRate, sourceUnit, targetUnit)
          : null;

      const nationalAvgRate =
        apiRate?.nationalAvgRate != null && apiRate.nationalAvgRate > 0
          ? convertRateForCropUnit(apiRate.nationalAvgRate, sourceUnit, targetUnit)
          : null;

      return {
        displayTitle,
        unit: targetUnit,
        localMinRate,
        localMaxRate,
        localAvgRate,
        nationalMinRate,
        nationalMaxRate,
        nationalAvgRate,
      };
    });
  }, [cropFields, data]);

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      {/* Header with LIVE Indicator */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Your Crop Prices</Text>
            {/* Glowing LIVE Indicator */}
            <View style={styles.liveBadge}>
              <View style={styles.redDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>📍 Mandi Rates: {userState}</Text>
        </View>

        <View style={styles.pill}>
          <Ionicons name="time-outline" size={11} color={theme.primary} />
          <Text style={styles.pillText}>Previous 24 hrs</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={styles.spinner} />
      ) : isError ? (
        <Text style={styles.emptyText}>Could not load crop prices right now.</Text>
      ) : (
        <>
          {/* Table Header */}
          <View style={styles.columnHeaderRow}>
            <Text style={[styles.columnHeader, styles.cropColumn]}>Crop</Text>
            <Text style={[styles.columnHeader, styles.rateColumn]}>Local Mandi</Text>
            <Text style={[styles.columnHeader, styles.rateColumn]}>National Avg</Text>
          </View>

          {/* Harvesting Stage Subcategory Rates List */}
          {subcategoryRates.length === 0 ? (
            <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 12 }]}>
              No active crops in harvesting stage to show live prices.
            </Text>
          ) : (
            subcategoryRates.map((rate) => {
              return (
                <View key={rate.displayTitle} style={styles.row}>
                  <View style={styles.cropColumn}>
                    <Text style={styles.cropName} numberOfLines={1}>
                      {rate.displayTitle}
                    </Text>
                  </View>

                  {/* Local Mandi Rate (Avg + Min/Max) */}
                  <View style={styles.rateColumn}>
                    {rate.localAvgRate != null && rate.localAvgRate > 0 ? (
                      <View style={{ gap: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                          <Text style={styles.rateValue}>{formatInr(rate.localAvgRate)}</Text>
                          <Text style={styles.rateUnit}>/{rate.unit}</Text>
                        </View>
                        {rate.localMinRate != null && rate.localMaxRate != null ? (
                          <Text style={styles.rangeSubtext}>
                            Min {formatInr(rate.localMinRate)} · Max {formatInr(rate.localMaxRate)}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={[styles.rateValue, { color: '#94a3b8' }]}>--</Text>
                    )}
                  </View>

                  {/* National Avg Rate (Avg + Min/Max) */}
                  <View style={styles.rateColumn}>
                    {rate.nationalAvgRate != null && rate.nationalAvgRate > 0 ? (
                      <View style={{ gap: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                          <Text style={[styles.rateValue, { color: '#334155' }]}>{formatInr(rate.nationalAvgRate)}</Text>
                          <Text style={styles.rateUnit}>/{rate.unit}</Text>
                        </View>
                        {rate.nationalMinRate != null && rate.nationalMaxRate != null ? (
                          <Text style={styles.rangeSubtext}>
                            Min {formatInr(rate.nationalMinRate)} · Max {formatInr(rate.nationalMaxRate)}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={[styles.rateValue, { color: '#94a3b8' }]}>--</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  liveText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#dc2626',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#16a34a',
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  pillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: theme.primary,
  },
  spinner: { marginVertical: 12 },
  emptyText: { color: '#64748b', fontSize: 13, fontFamily: FONT.medium },
  columnHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  columnHeader: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cropColumn: { flex: 1.4 },
  rateColumn: { flex: 1, alignItems: 'flex-start' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  cropName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  rateValue: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: theme.primary,
  },
  rateUnit: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  rangeSubtext: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
});
