import React from 'react';
// Updated HarvestingCropPricesCard component
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { HarvestType } from '@/constants/cropCategoriesData';

const theme = RoleThemes.FARMER;

export interface HarvestingCropItem {
  id: string;
  cropName: string;
  categoryName: string;
  fieldName: string;
  stage: 'HARVESTING' | 'SOWING' | 'GROWTH';
  unit: string;
  expectedPrice: string;
  mandiPrice: string;
  priceTrend: 'UP' | 'STABLE' | 'DOWN';
  trendDifference: string;
  harvestType?: HarvestType;
}

interface HarvestingCropPricesCardProps {
  crops: HarvestingCropItem[];
  onLogSalePress?: (crop: HarvestingCropItem) => void;
}

export const HarvestingCropPricesCard: React.FC<HarvestingCropPricesCardProps> = ({
  crops,
  onLogSalePress,
}) => {
  const harvestingCrops = crops.filter((c) => c.stage === 'HARVESTING');

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.title}>Harvesting Stage Crop Prices</Text>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>🌾 Cut Off / Ready</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Live market rates for crops ready for harvest ({harvestingCrops.length})
          </Text>
        </View>
      </View>

      {harvestingCrops.length > 0 ? (
        <View style={{ gap: 10, marginTop: 10 }}>
          {harvestingCrops.map((crop) => {
            const isContinuous = (crop.harvestType || 'CONTINUOUS') === 'CONTINUOUS';
            return (
              <View key={crop.id} style={styles.cropRow}>
                <View style={styles.iconBg}>
                  <Ionicons name="leaf" size={20} color="#15803d" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.cropName}>{crop.cropName}</Text>
                    {/* Read-Only Harvest Type Badge */}
                    <View style={[styles.harvestTypeTag, isContinuous ? { backgroundColor: '#e0f2fe' } : { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.harvestTypeTagText, isContinuous ? { color: '#0369a1' } : { color: '#b45309' }]}>
                        {isContinuous ? '🔄 Daily Rate Active' : '🌾 Seasonal MSP Rate'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.fieldSub}>📍 {crop.fieldName}</Text>

                  {/* Price Comparisons: Expected vs Mandi */}
                  <View style={styles.priceRow}>
                    <View style={styles.pricePill}>
                      <Text style={styles.priceLabel}>
                        {isContinuous ? 'Expected Daily:' : 'Harvest Rate:'}
                      </Text>
                      <Text style={styles.priceVal}>₹{crop.expectedPrice}/{crop.unit}</Text>
                    </View>

                    {/* Reflect Daily Price ONLY for Continuous Crops */}
                    {isContinuous ? (
                      <View style={styles.mandiPill}>
                        <Ionicons name="sparkles" size={11} color="#16a34a" />
                        <Text style={styles.mandiLabel}>Live Daily Mandi:</Text>
                        <Text style={styles.mandiVal}>₹{crop.mandiPrice}/{crop.unit}</Text>
                      </View>
                    ) : (
                      <View style={[styles.mandiPill, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                        <Text style={[styles.mandiLabel, { color: '#64748b' }]}>Single Season MSP:</Text>
                        <Text style={[styles.mandiVal, { color: '#334155' }]}>₹{crop.expectedPrice}/{crop.unit}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Trend & Action */}
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  {isContinuous ? (
                    <View
                      style={[
                        styles.trendBadge,
                        crop.priceTrend === 'UP'
                          ? { backgroundColor: '#dcfce7' }
                          : { backgroundColor: '#fef3c7' },
                      ]}
                    >
                      <Ionicons
                        name={crop.priceTrend === 'UP' ? 'trending-up' : 'remove-outline'}
                        size={13}
                        color={crop.priceTrend === 'UP' ? '#16a34a' : '#d97706'}
                      />
                      <Text
                        style={[
                          styles.trendText,
                          crop.priceTrend === 'UP' ? { color: '#15803d' } : { color: '#b45309' },
                        ]}
                      >
                        {crop.trendDifference}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.trendBadge, { backgroundColor: '#f1f5f9' }]}>
                      <Text style={[styles.trendText, { color: '#475569' }]}>Fixed Seasonal</Text>
                    </View>
                  )}

                  {onLogSalePress ? (
                    <TouchableOpacity
                      style={styles.saleBtn}
                      activeOpacity={0.8}
                      onPress={() => onLogSalePress(crop)}
                    >
                      <Text style={styles.saleBtnText}>Log Harvest Sale</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Ionicons name="sparkles-outline" size={28} color="#cbd5e1" />
          <Text style={styles.emptyText}>No crops at Harvesting stage right now.</Text>
          <Text style={styles.emptySub}>
            Set crop stage to "Harvesting 🌾" in My Crops to see live harvesting crop market prices!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#dcfce7',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  readyBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  readyBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 3,
  },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  harvestTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  harvestTypeTagText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  fieldSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  priceVal: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  mandiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  mandiLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#15803d',
  },
  mandiVal: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  trendText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  saleBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  saleBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 4,
  },
  emptyText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
