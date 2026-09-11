import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyCropRates } from '../hooks/useMarketRates';
import { useAuth } from '../store/auth-context';
import { useCrops } from '../store/crops-context';
import { formatInr } from '../utils/formatInr';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';

const theme = RoleThemes.FARMER;

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
  // Calculate 24h Min, Max & Avg for State level and National level.
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

      const localAvgRate =
        apiRate?.localAvgRate != null && apiRate.localAvgRate > 0
          ? convertRateForCropUnit(apiRate.localAvgRate, sourceUnit, targetUnit)
          : null;

      const localMinRate =
        localAvgRate != null
          ? convertRateForCropUnit(apiRate?.localMinRate ?? apiRate!.localAvgRate!, sourceUnit, targetUnit)
          : null;

      const localMaxRate =
        localAvgRate != null
          ? convertRateForCropUnit(apiRate?.localMaxRate ?? apiRate!.localAvgRate!, sourceUnit, targetUnit)
          : null;

      const nationalAvgRate =
        apiRate?.nationalAvgRate != null && apiRate.nationalAvgRate > 0
          ? convertRateForCropUnit(apiRate.nationalAvgRate, sourceUnit, targetUnit)
          : null;

      const nationalMinRate =
        nationalAvgRate != null
          ? convertRateForCropUnit(apiRate?.nationalMinRate ?? apiRate!.nationalAvgRate!, sourceUnit, targetUnit)
          : null;

      const nationalMaxRate =
        nationalAvgRate != null
          ? convertRateForCropUnit(apiRate?.nationalMaxRate ?? apiRate!.nationalAvgRate!, sourceUnit, targetUnit)
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
      {/* Compact Header with LIVE Indicator */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your Crop Prices</Text>
          <View style={styles.liveBadge}>
            <View style={styles.redDot} />
            <Text style={styles.liveText}>LIVE 24H</Text>
          </View>
        </View>

        <View style={styles.pill}>
          <Ionicons name="time-outline" size={10} color={theme.primary} />
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
            <Text style={[styles.columnHeader, styles.cropColumn]}>Your Crop</Text>
            <Text style={[styles.columnHeader, styles.rateColumn]}>Local ({userState})</Text>
            <Text style={[styles.columnHeader, styles.rateColumn]}>National</Text>
          </View>

          {/* Subcategory Rates List */}
          {subcategoryRates.length === 0 ? (
            <Text style={[styles.emptyText, { textAlign: 'center', marginVertical: 8 }]}>
              No active crops in harvesting stage to show live prices.
            </Text>
          ) : (
            subcategoryRates.map((rate) => {
              const hasLocal = rate.localAvgRate != null && rate.localAvgRate > 0;
              const hasNational = rate.nationalAvgRate != null && rate.nationalAvgRate > 0;

              return (
                <View key={rate.displayTitle} style={styles.row}>
                  {/* 1. Crop Name & Unit */}
                  <View style={styles.cropColumn}>
                    <Text style={styles.cropName} numberOfLines={1}>
                      {rate.displayTitle}
                    </Text>
                    <Text style={styles.cropUnitSub}>Per {rate.unit}</Text>
                  </View>

                  {/* 2. Local (State) Rate Box */}
                  <View style={styles.rateColumn}>
                    {hasLocal ? (
                      <View style={styles.rateDetailBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                          <Text style={styles.rateLabelPrefix}>Avg: </Text>
                          <Text style={styles.rateValueAvg}>{formatInr(rate.localAvgRate!)}</Text>
                        </View>
                        <View style={styles.minMaxRow}>
                          <Text style={styles.minText}>
                            Min: <Text style={{ fontFamily: FONT.bold }}>{formatInr(rate.localMinRate!)}</Text>
                          </Text>
                          <Text style={styles.maxText}>
                            Max: <Text style={{ fontFamily: FONT.bold }}>{formatInr(rate.localMaxRate!)}</Text>
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.dashText}>-</Text>
                    )}
                  </View>

                  {/* 3. National Rate Box */}
                  <View style={styles.rateColumn}>
                    {hasNational ? (
                      <View style={styles.rateDetailBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                          <Text style={styles.rateLabelPrefix}>Avg: </Text>
                          <Text style={[styles.rateValueAvg, { color: '#0f172a' }]}>{formatInr(rate.nationalAvgRate!)}</Text>
                        </View>
                        <View style={styles.minMaxRow}>
                          <Text style={styles.minText}>
                            Min: <Text style={{ fontFamily: FONT.bold }}>{formatInr(rate.nationalMinRate!)}</Text>
                          </Text>
                          <Text style={styles.maxText}>
                            Max: <Text style={{ fontFamily: FONT.bold }}>{formatInr(rate.nationalMaxRate!)}</Text>
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.dashText}>-</Text>
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
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  redDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#dc2626',
  },
  liveText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#dc2626',
    letterSpacing: 0.2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  pillText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: theme.primary,
  },
  spinner: { marginVertical: 8 },
  emptyText: { color: '#64748b', fontSize: 11.5, fontFamily: FONT.medium },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  columnHeader: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cropColumn: { flex: 1.1 },
  rateColumn: { flex: 1, alignItems: 'flex-start' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  cropName: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  cropUnitSub: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 0.5,
  },
  rateDetailBox: {
    gap: 1,
  },
  rateLabelPrefix: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  rateValueAvg: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: theme.primary,
  },
  minMaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minText: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#15803d',
  },
  maxText: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#dc2626',
  },
  dashText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
});
