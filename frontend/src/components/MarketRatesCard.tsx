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
    cropName: 'Rose (गुलाब)',
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
    cropName: 'Wheat (गेहूँ)',
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
    cropName: 'Tomato (टमाटर)',
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
    cropName: 'Marigold (गेंदा)',
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

import { useCrops } from '../store/crops-context';

export function MarketRatesCard() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useMyCropRates();
  const { cropFields } = useCrops();

  const userState = user?.state || data?.state || 'Punjab';

  // Filter user's active cropFields that are in "HARVESTING" stage and are continuous (daily-based)
  const userHarvestingCrops = cropFields.filter(
    (c) => c.status === 'ACTIVE' && c.stage === 'HARVESTING' && c.harvestType === 'CONTINUOUS'
  );

  // Map user's crops to their live/default rates
  const liveRates = userHarvestingCrops.map((userCrop) => {
    const userCropEng = userCrop.cropName.split('(')[0].trim().toLowerCase();

    // Find matching rate from backend API data
    const apiRate = data?.rates?.find((r) => {
      const rEng = r.cropName.split('(')[0].trim().toLowerCase();
      return rEng === userCropEng || userCropEng.includes(rEng) || rEng.includes(userCropEng);
    });

    // Find matching default mock rate
    const defaultRate = DEFAULT_HARVESTING_CROPS_RATES.find((r) => {
      const rEng = r.cropName.split('(')[0].trim().toLowerCase();
      return rEng === userCropEng || userCropEng.includes(rEng) || rEng.includes(userCropEng);
    });

    // Determine unit
    const unit = apiRate?.unit || defaultRate?.unit || userCrop.unit || 'KG';

    // Determine local avg price (prioritize backend API rate)
    const localAvgRate =
      apiRate?.localAvgRate != null
        ? apiRate.localAvgRate
        : defaultRate?.localAvgRate != null
        ? defaultRate.localAvgRate
        : Number(userCrop.pricePerUnit) || 0;

    // Determine national avg price (prioritize backend API rate)
    const nationalAvgRate =
      apiRate?.nationalAvgRate != null
        ? apiRate.nationalAvgRate
        : defaultRate?.nationalAvgRate != null
        ? defaultRate.nationalAvgRate
        : Math.round(localAvgRate * 0.9);

    return {
      cropName: userCrop.cropName,
      unit,
      localAvgRate,
      nationalAvgRate,
    };
  });

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
          <Text style={styles.subtitle}>📍 Mandi Rates: {userState} Mandi</Text>
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

          {/* Harvesting Stage Crops List */}
          {liveRates.length === 0 ? (
            <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 12 }]}>
              No active crops in harvesting stage to show prices.
            </Text>
          ) : (
            liveRates.map((rate) => {
              return (
                <View key={rate.cropName} style={styles.row}>
                  <View style={styles.cropColumn}>
                    <Text style={styles.cropName} numberOfLines={1}>
                      {rate.cropName}
                    </Text>
                  </View>

                  {/* Local Mandi Rate (Single Inline Row) */}
                  <View style={[styles.rateColumn, { flexDirection: 'row', alignItems: 'baseline', gap: 3 }]}>
                    <Text style={styles.rateValue}>
                      {formatInr(rate.localAvgRate)}
                    </Text>
                    <Text style={styles.rateUnit}>/{rate.unit}</Text>
                  </View>

                  {/* National Avg Rate (Single Inline Row) */}
                  <View style={[styles.rateColumn, { flexDirection: 'row', alignItems: 'baseline', gap: 3 }]}>
                    <Text style={[styles.rateValue, { color: '#475569' }]}>
                      {formatInr(rate.nationalAvgRate)}
                    </Text>
                    <Text style={styles.rateUnit}>/{rate.unit}</Text>
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
});
