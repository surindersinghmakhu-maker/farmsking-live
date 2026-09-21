import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, Pressable, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { BrandLogo } from './BrandLogo';
import { useMyCropRates } from '../hooks/useMarketRates';
import { useAuth } from '../store/auth-context';
import { useCrops } from '../store/crops-context';
import { formatInr } from '../utils/formatInr';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';

const theme = RoleThemes.FARMER;

interface CropRateItem {
  displayTitle: string;
  unit: string;
  localMinRate: number | null;
  localMaxRate: number | null;
  localAvgRate: number | null;
  nationalMinRate: number | null;
  nationalMaxRate: number | null;
  nationalAvgRate: number | null;
}

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

  const [selectedCropForShare, setSelectedCropForShare] = useState<CropRateItem | null>(null);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const posterRef = useRef<any>(null);

  const userState = user?.state || data?.state || 'Punjab';

  // Calculate 24h Min, Max & Avg for State level and National level for crops currently in HARVESTING stage.
  const subcategoryRates = useMemo(() => {
    if (!data?.rates || data.rates.length === 0) {
      return [];
    }

    // Filter to user crops that are currently in HARVESTING stage
    const harvestingCropNames = new Set<string>();
    const userCropUnitMap = new Map<string, string>();

    (cropFields || []).forEach((c) => {
      if (c.stage === 'HARVESTING' || (c as any).status === 'HARVESTING') {
        let baseName = c.cropName.split('(')[0].trim();
        if (c.variety && baseName.toLowerCase().includes(c.variety.toLowerCase())) {
          baseName = baseName.replace(new RegExp(c.variety, 'gi'), '').trim();
        }
        harvestingCropNames.add(baseName.toLowerCase());
        userCropUnitMap.set(baseName.toLowerCase(), c.unit || 'KG');
      }
    });

    // Only process rates for crops that are currently in HARVESTING stage
    const ratesToProcess = harvestingCropNames.size > 0
      ? data.rates.filter((r) => {
          const cropKey = r.cropName.split('(')[0].trim().toLowerCase();
          return harvestingCropNames.has(cropKey);
        })
      : [];

    return ratesToProcess.map((r) => {
      const cropKey = r.cropName.split('(')[0].trim().toLowerCase();
      const userUnit = userCropUnitMap.get(cropKey);
      const sourceUnit = r.unit || 'KG';
      const targetUnit = userUnit || (r.cropName === 'Wheat' || r.cropName === 'Paddy' ? 'Quintal' : 'KG');

      const localAvgRate =
        r.localAvgRate != null && r.localAvgRate > 0
          ? convertRateForCropUnit(r.localAvgRate, sourceUnit, targetUnit)
          : null;

      const localMinRate =
        localAvgRate != null
          ? convertRateForCropUnit(r.localMinRate ?? r.localAvgRate!, sourceUnit, targetUnit)
          : null;

      const localMaxRate =
        localAvgRate != null
          ? convertRateForCropUnit(r.localMaxRate ?? r.localAvgRate!, sourceUnit, targetUnit)
          : null;

      const nationalAvgRate =
        r.nationalAvgRate != null && r.nationalAvgRate > 0
          ? convertRateForCropUnit(r.nationalAvgRate, sourceUnit, targetUnit)
          : null;

      const nationalMinRate =
        nationalAvgRate != null
          ? convertRateForCropUnit(r.nationalMinRate ?? r.nationalAvgRate!, sourceUnit, targetUnit)
          : null;

      const nationalMaxRate =
        nationalAvgRate != null
          ? convertRateForCropUnit(r.nationalMaxRate ?? r.nationalAvgRate!, sourceUnit, targetUnit)
          : null;

      return {
        displayTitle: r.cropName,
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

  // Handler for sharing crop rates as Text
  const handleShareText = async (crop: CropRateItem) => {
    setSelectedCropForShare(null);

    const now = new Date();
    const todayDateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const currentTimeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const localStr =
      crop.localAvgRate != null
        ? `• Avg Rate: ${formatInr(crop.localAvgRate)}\n• Min Rate: ${formatInr(crop.localMinRate!)}  |  Max Rate: ${formatInr(crop.localMaxRate!)}`
        : '• No sales recorded in last 24h (-)';

    const nationalStr =
      crop.nationalAvgRate != null
        ? `• Avg Rate: ${formatInr(crop.nationalAvgRate)}\n• Min Rate: ${formatInr(crop.nationalMinRate!)}  |  Max Rate: ${formatInr(crop.nationalMaxRate!)}`
        : '• No sales recorded in last 24h (-)';

    const userRefCode = user?.kingId ? user.kingId : '';
    const shareLink = userRefCode
      ? `https://farmsking-1.vercel.app/register?ref=${userRefCode}`
      : `https://farmsking-1.vercel.app`;

    const referralInfoStr = userRefCode
      ? `🎁 *Register on FarmsKing using this link or Referral Coupon \`${userRefCode}\` to get Welcome Reward bonus in your wallet!*\n👉 ${shareLink}`
      : `📲 *Use FarmsKing App to check real-time crop market rates:*\n👉 ${shareLink}`;

    const textMessage =
      `🌾 *FarmsKing — Live Market Rates (24h)* 📊\n` +
      `🌱 *Crop:* ${crop.displayTitle} (Per ${crop.unit})\n` +
      `📅 *Date & Time:* ${todayDateStr}, ${currentTimeStr}\n\n` +
      `🏛️ *LOCAL RATES:*\n${localStr}\n\n` +
      `🇮🇳 *NATIONAL RATES:*\n${nationalStr}\n\n` +
      `${referralInfoStr}`;

    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(textMessage)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message: textMessage });
      }
    } catch (err) {
      console.warn('Share text failed, fallback to system share:', err);
      await Share.share({ message: textMessage });
    }
  };

  // Helper for generating dynamic poster file name: CropName_DDMMYY_HHMM.png
  const getCropRateFileName = (cropTitle: string) => {
    const now = new Date();
    const cleanCropName = cropTitle.trim().replace(/[^a-zA-Z0-9]/g, '');
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${yy}`;

    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}${min}`;

    return `${cleanCropName}_${dateStr}_${timeStr}.png`;
  };

  // Helper for generating high quality image card poster on Web browsers
  const generateWebImageCard = (crop: CropRateItem) => {
    try {
      const now = new Date();
      const todayDateStr = now.toISOString().split('T')[0];
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 460;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 640, 460);

      // Outer Border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 640, 460);

      // Top Red Stripe Accent
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 640, 6);

      // Tiled Anti-Crop Watermark Grid
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 22px sans-serif';
      ctx.rotate((-15 * Math.PI) / 180);
      for (let y = -100; y < 650; y += 80) {
        for (let x = -200; x < 800; x += 190) {
          ctx.fillText('👑 FarmsKing', x, y);
        }
      }
      ctx.restore();

      // Header Row: Left VCH/Date
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('PRC-253978', 24, 34);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(todayDateStr, 24, 52);

      // Header Center: Brand Logo + FarmsKing + Tagline
      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 FarmsKing', 320, 36);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Smart Farming, Better Future', 320, 54);
      ctx.textAlign = 'left';

      // Header Right: OFFICIAL Pill
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(530, 24, 84, 24);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('OFFICIAL', 545, 40);

      // Red Pill Banner
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(170, 72, 300, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌾 MARKET CROP RATES CARD 🌾', 320, 92);
      ctx.textAlign = 'left';

      // Market / Location Full Width Box (Red)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(24, 116, 592, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🏛️ MARKET / LOCATION', 32, 132);

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(24, 116, 592, 75);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`State: ${userState}`, 32, 158);
      ctx.fillStyle = '#475569';
      ctx.font = '11px sans-serif';
      ctx.fillText(`📍 ${user?.farmAddress || [user?.village, user?.district].filter(Boolean).join(', ') || 'Punjab Mandi'}`, 32, 176);

      // Main Amount Box (Red Border)
      const mainRate = crop.localAvgRate ?? crop.nationalAvgRate ?? 0;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.fillRect(24, 205, 592, 175);
      ctx.strokeRect(24, 205, 592, 175);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Market Average Rate:', 40, 236);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`₹${mainRate.toLocaleString('en-IN')}`, 596, 238);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText(`📝 Crop: ${crop.displayTitle} (Per ${crop.unit})`, 40, 268);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Local State Range (${userState}):`, 40, 300);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(crop.localAvgRate != null ? `Min: ₹${crop.localMinRate}  |  Max: ₹${crop.localMaxRate}` : 'No Local Sales', 596, 300);
      ctx.textAlign = 'left';

      // Divider line
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 318);
      ctx.lineTo(596, 318);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('National Average Rate (All India):', 40, 345);
      ctx.textAlign = 'right';
      ctx.fillText(crop.nationalAvgRate != null ? `₹${crop.nationalAvgRate} (Verified)` : '-', 596, 345);
      ctx.textAlign = 'left';

      // Bottom Footer
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Computer Generated Official Rate Card - FarmsKing Platform', 320, 415);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText('Verified Digital Record', 320, 432);

      const dataUrl = canvas.toDataURL('image/png');
      const fileName = getCropRateFileName(crop.displayTitle);

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Alert.alert('Success 🖼️', `${crop.displayTitle} Professional Price Poster downloaded as ${fileName}! You can now share it on WhatsApp.`);
    } catch (err) {
      console.error('Web Canvas image generation error:', err);
      Alert.alert('Error', 'Failed to generate web image card.');
    }
  };

  // Handler for sharing crop rates as Image Poster
  const handleShareImage = async (crop: CropRateItem) => {
    setIsSharingImage(true);

    if (Platform.OS === 'web') {
      generateWebImageCard(crop);
      setIsSharingImage(false);
      setSelectedCropForShare(null);
      return;
    }

    try {
      // Small timeout to allow ViewShot poster ref to render cleanly on mobile
      setTimeout(async () => {
        try {
          if (!posterRef.current) {
            Alert.alert('Error', 'Could not generate poster image.');
            setIsSharingImage(false);
            setSelectedCropForShare(null);
            return;
          }

          const fileName = getCropRateFileName(crop.displayTitle);

          const uri = await captureRef(posterRef, {
            format: 'png',
            quality: 0.95,
            fileName: fileName.replace('.png', ''),
          });

          const isSharingAvailable = await Sharing.isAvailableAsync();
          if (isSharingAvailable) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: `Share ${crop.displayTitle} Market Rates (${fileName})`,
              UTI: 'public.png',
            });
          } else {
            Alert.alert('Notice', 'Image sharing is not supported on this device.');
          }
        } catch (err) {
          console.error('Image capture error:', err);
          Alert.alert('Error', 'Failed to create price card image.');
        } finally {
          setIsSharingImage(false);
          setSelectedCropForShare(null);
        }
      }, 300);
    } catch (err) {
      setIsSharingImage(false);
      setSelectedCropForShare(null);
    }
  };

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
            <Text style={[styles.columnHeader, styles.shareColumn]}>Share</Text>
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

                  {/* 4. Crop-wise Share Button */}
                  <TouchableOpacity
                    style={styles.shareButton}
                    activeOpacity={0.7}
                    onPress={() => setSelectedCropForShare(rate)}
                  >
                    <Ionicons name="share-social-outline" size={15} color="#16a34a" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </>
      )}

      {/* Share Options Modal (Text vs Image Card) */}
      <Modal
        visible={selectedCropForShare !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCropForShare(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedCropForShare(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>🌾</Text>
                <Text style={styles.modalTitle}>Share {selectedCropForShare?.displayTitle} Rates</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCropForShare(null)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>How would you like to share these market rates?</Text>

            {/* Share as Text Option */}
            <TouchableOpacity
              style={styles.shareOptionCard}
              activeOpacity={0.8}
              onPress={() => selectedCropForShare && handleShareText(selectedCropForShare)}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="logo-whatsapp" size={22} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>💬 Share as Text Message</Text>
                <Text style={styles.optionSub}>Share formatted text message with app link on WhatsApp</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* Share as Image Card Option */}
            <TouchableOpacity
              style={styles.shareOptionCard}
              activeOpacity={0.8}
              onPress={() => selectedCropForShare && handleShareImage(selectedCropForShare)}
              disabled={isSharingImage}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
                {isSharingImage ? (
                  <ActivityIndicator size="small" color="#0284c7" />
                ) : (
                  <Ionicons name="image-outline" size={22} color="#0284c7" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>🖼️ Share as Image Poster</Text>
                <Text style={styles.optionSub}>Share branded FarmsKing crop price poster card</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Offscreen ViewShot Poster Component for generating Crop Rate Image Card */}
      {selectedCropForShare && (
        <View style={styles.offscreenContainer}>
          <ViewShot ref={posterRef} options={{ format: 'png', quality: 0.95 }} style={styles.posterCard}>
            {/* Top Red Stripe Accent */}
            <View style={styles.posterTopRedStripe} />

            {/* Tiled Anti-Crop Background Watermark Grid */}
            <View style={styles.posterWatermarkGridContainer} pointerEvents="none">
              {Array.from({ length: 8 }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.posterWatermarkRow}>
                  {Array.from({ length: 3 }).map((_, colIndex) => (
                    <View key={colIndex} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 4 }}>
                      <BrandLogo size={16} useGoldRing />
                      <Text style={styles.posterWatermarkTileText}>FarmsKing</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Voucher Header Row */}
            <View style={styles.posterVoucherHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.posterVchNo}>
                  PRC-{Math.floor(100000 + ((selectedCropForShare.displayTitle.charCodeAt(0) || 5) * 123) % 900000)}
                </Text>
                <Text style={styles.posterVchDate}>
                  {new Date().toISOString().split('T')[0]}
                </Text>
              </View>

              <View style={{ flex: 1.8, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrandLogo size={28} useGoldRing />
                  <Text style={styles.posterVchBrandTitle}>FarmsKing</Text>
                </View>
                <Text style={styles.posterVchBrandSub}>Smart Farming, Better Future</Text>
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={styles.posterOfficialPill}>
                  <Text style={styles.posterOfficialText}>OFFICIAL</Text>
                </View>
              </View>
            </View>

            {/* Red Pill Title Banner */}
            <View style={styles.posterRedPillBanner}>
              <Text style={styles.posterRedPillText}>🌾 MARKET CROP RATES VOUCHER 🌾</Text>
            </View>

            {/* Market Location Box */}
            <View style={styles.posterPartyGridRow}>
              <View style={[styles.posterSideBox, { borderColor: '#dc2626' }]}>
                <View style={[styles.posterSideBoxHeader, { backgroundColor: '#dc2626' }]}>
                  <Text style={styles.posterSideBoxHeaderTitle}>🏛️ MARKET / LOCATION</Text>
                </View>
                <View style={styles.posterSideBoxBody}>
                  <Text style={styles.posterPartyNameBold} numberOfLines={1}>
                    State: {userState}
                  </Text>
                  <Text style={styles.posterPartySubText} numberOfLines={1}>
                    📍 {user?.farmAddress || [user?.village, user?.district].filter(Boolean).join(', ') || 'Punjab Mandi'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Total Voucher Amount Main Crop Card (Red Border Box) */}
            <View style={styles.posterMainCropAmountBox}>
              <View style={styles.posterMainCropHeaderRow}>
                <Text style={styles.posterMainCropTitleLabel}>
                  Market Average Rate:
                </Text>
                <Text style={styles.posterMainCropPriceValue}>
                  {formatInr(selectedCropForShare.localAvgRate ?? selectedCropForShare.nationalAvgRate ?? 0)}
                </Text>
              </View>

              <Text style={styles.posterMemoText}>
                📝 Memo: <Text style={{ fontFamily: FONT.bold, color: '#0f172a' }}>{selectedCropForShare.displayTitle}</Text> (Per {selectedCropForShare.unit})
              </Text>

              <View style={styles.posterBalanceLine}>
                <Text style={styles.posterBalanceLabel}>Local State Range ({userState}):</Text>
                <Text style={styles.posterBalanceValue}>
                  {selectedCropForShare.localAvgRate != null
                    ? `Min: ${formatInr(selectedCropForShare.localMinRate!)}  |  Max: ${formatInr(selectedCropForShare.localMaxRate!)}`
                    : 'No Local Sales'}
                </Text>
              </View>

              <View style={[styles.posterBalanceLine, styles.posterNetLine]}>
                <Text style={styles.posterNetLabel}>National Average Rate (All India):</Text>
                <Text style={styles.posterNetValue}>
                  {selectedCropForShare.nationalAvgRate != null
                    ? `${formatInr(selectedCropForShare.nationalAvgRate)} (Verified)`
                    : '-'}
                </Text>
              </View>
            </View>

            {/* Bottom Footer Note */}
            <View style={styles.posterFooterVoucherNote}>
              <Text style={styles.posterFooterVoucherText}>
                Computer Generated Official Rate Card - FarmsKing Platform
              </Text>
              <Text style={styles.posterFooterVoucherSub}>Verified Digital Record</Text>
            </View>
          </ViewShot>
        </View>
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
  shareColumn: { width: 34, alignItems: 'center' },
  shareButton: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginBottom: 4,
  },
  shareOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  optionSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  offscreenContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  posterCard: {
    width: 340,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  posterWatermarkGridContainer: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    left: -50,
    right: -50,
    flexDirection: 'column',
    justifyContent: 'space-around',
    opacity: 0.12,
    transform: [{ rotate: '-15deg' }],
  },
  posterWatermarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  posterWatermarkTileText: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#166534',
    marginHorizontal: 4,
  },
  posterTopRedStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#dc2626',
  },
  posterVoucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  posterVchNo: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  posterVchDate: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  posterVchBrandTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
    letterSpacing: -0.2,
  },
  posterVchBrandSub: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  posterOfficialPill: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  posterOfficialText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  posterRedPillBanner: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    alignSelf: 'center',
    marginVertical: 2,
  },
  posterRedPillText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  posterPartyGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
  },
  posterSideBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  posterSideBoxHeader: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
  },
  posterSideBoxHeaderTitle: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  posterSideBoxBody: {
    padding: 6,
    gap: 2,
  },
  posterPartyNameBold: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  posterPartySubText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  posterMainCropAmountBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 4,
    marginVertical: 2,
  },
  posterMainCropHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingBottom: 6,
    marginBottom: 4,
  },
  posterMainCropTitleLabel: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  posterMainCropPriceValue: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
  },
  posterMemoText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#475569',
    marginBottom: 4,
  },
  posterBalanceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  posterBalanceLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  posterBalanceValue: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  posterNetLine: {
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    paddingTop: 4,
    marginTop: 2,
  },
  posterNetLabel: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },
  posterNetValue: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
  },
  posterFooterVoucherNote: {
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  posterFooterVoucherText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  posterFooterVoucherSub: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  posterDash: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
});
