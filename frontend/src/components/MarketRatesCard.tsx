import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, Pressable, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  // Calculate 24h Min, Max & Avg for State level and National level for all market rate crops.
  const subcategoryRates = useMemo(() => {
    if (!data?.rates || data.rates.length === 0) {
      return [];
    }

    // Map user's registered crop units for target unit conversion
    const userCropUnitMap = new Map<string, string>();
    (cropFields || []).forEach((c) => {
      let baseName = c.cropName.split('(')[0].trim();
      if (c.variety && baseName.toLowerCase().includes(c.variety.toLowerCase())) {
        baseName = baseName.replace(new RegExp(c.variety, 'gi'), '').trim();
      }
      userCropUnitMap.set(baseName.toLowerCase(), c.unit || 'KG');
    });

    return data.rates.map((r) => {
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

    const textMessage =
      `🌾 *FarmsKing — Live Market Rates (24h)* 📊\n` +
      `🌱 *Crop:* ${crop.displayTitle} (Per ${crop.unit})\n` +
      `📅 *Date & Time:* ${todayDateStr}, ${currentTimeStr}\n\n` +
      `🏛️ *LOCAL RATES:*\n${localStr}\n\n` +
      `🇮🇳 *NATIONAL RATES:*\n${nationalStr}\n\n` +
      `📲 *Use FarmsKing App to check real-time crop market rates:*\n` +
      `👉 https://farmsking-1.vercel.app`;

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

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Card background with rounded outer border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 640, 450);

      // Tiled Anti-Crop Background Watermark across entire poster
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 23px sans-serif';
      ctx.rotate((-15 * Math.PI) / 180);

      for (let y = -100; y < 650; y += 80) {
        for (let x = -200; x < 800; x += 190) {
          ctx.fillText('👑 FarmsKing', x, y);
        }
      }
      ctx.restore();

      // Top Emerald Header Bar
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, 640, 75);

      // Header Logo & Brand Name (Left)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('👑 FarmsKing', 24, 38);

      ctx.fillStyle = '#bbf7d0';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Smart Farming, Better Future', 24, 58);

      // Right Side Header Tagline
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText("India's Digital Mandi & Farm Ledger", 616, 42);
      ctx.textAlign = 'left'; // Reset text alignment

      // Crop Name Dedicated Card Container
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(24, 88, 592, 44, 10);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(24, 88, 592, 44);
        ctx.strokeRect(24, 88, 592, 44);
      }

      // Accent Line inside card
      ctx.fillStyle = '#16a34a';
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(36, 98, 4, 24, 2);
        ctx.fill();
      } else {
        ctx.fillRect(36, 98, 4, 24);
      }

      // Crop Title with Leaf Icon
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`🌱  ${crop.displayTitle}`, 48, 117);

      // Unit Badge inside card
      ctx.fillStyle = '#15803d';
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(500, 96, 104, 28, 14);
        ctx.fill();
      } else {
        ctx.fillRect(500, 96, 104, 28);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Per ${crop.unit}`, 552, 114);
      ctx.textAlign = 'left'; // Reset text alignment

      // Date & Time Subtitle Bar with translucent background container
      ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(24, 142, 592, 28, 6);
        ctx.fill();
      } else {
        ctx.fillRect(24, 142, 592, 28);
      }
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 12.5px sans-serif';
      ctx.fillText(`📅 Date: ${todayDateStr}   |   🕒 Time: ${currentTimeStr}   |   ⏱️ 24H Live Rates`, 36, 160);

      // Local Box with translucent fill so watermark shows behind text
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(24, 178, 592, 95, 12);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(24, 178, 592, 95);
        ctx.strokeRect(24, 178, 592, 95);
      }

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('🏛️ LOCAL MARKET RATES', 44, 214);

      if (crop.localAvgRate != null) {
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`Avg: ₹${crop.localAvgRate}`, 420, 218);

        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Min: ₹${crop.localMinRate}`, 390, 252);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Max: ₹${crop.localMaxRate}`, 490, 252);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('-', 500, 230);
      }

      // National Box with translucent fill so watermark shows behind text
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(24, 288, 592, 95, 12);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(24, 288, 592, 95);
        ctx.strokeRect(24, 288, 592, 95);
      }

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('🇮🇳 NATIONAL (ALL INDIA) RATES', 44, 324);

      if (crop.nationalAvgRate != null) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`Avg: ₹${crop.nationalAvgRate}`, 420, 328);

        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Min: ₹${crop.nationalMinRate}`, 390, 362);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Max: ₹${crop.nationalMaxRate}`, 490, 362);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('-', 500, 340);
      }

      // Bottom Footer Bar
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 400, 640, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('📲 Download FarmsKing App for Real-Time Mandi Rates', 24, 430);

      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('farmsking-1.vercel.app', 460, 430);

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
              <View>
                <Text style={styles.posterVchNo}>CROP RATE CARD</Text>
                <Text style={styles.posterVchDate}>
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrandLogo size={32} useGoldRing />
                  <Text style={styles.posterVchBrandTitle}>FarmsKing</Text>
                </View>
                <Text style={styles.posterVchBrandSub}>Smart Farming, Better Future</Text>
              </View>

              <View style={styles.posterOfficialPill}>
                <Text style={styles.posterOfficialText}>OFFICIAL</Text>
              </View>
            </View>

            {/* Red Pill Banner */}
            <View style={styles.posterRedPillBanner}>
              <Text style={styles.posterRedPillText}>💸 LIVE CROP MARKET RATES 💸</Text>
            </View>

            {/* Side-by-Side Regional Rate Boxes */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Local Market Rates Box */}
              <View style={[styles.posterSideBox, { borderColor: '#16a34a' }]}>
                <View style={[styles.posterSideBoxHeader, { backgroundColor: '#16a34a' }]}>
                  <Text style={styles.posterSideBoxHeaderTitle}>🏛️ LOCAL MARKET</Text>
                </View>
                <View style={styles.posterSideBoxBody}>
                  {selectedCropForShare.localAvgRate != null ? (
                    <>
                      <Text style={[styles.posterSideAvgVal, { color: '#16a34a' }]}>{formatInr(selectedCropForShare.localAvgRate)}</Text>
                      <Text style={styles.posterSideMinMax}>
                        Min: {formatInr(selectedCropForShare.localMinRate!)}  |  Max: {formatInr(selectedCropForShare.localMaxRate!)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.posterDash}>-</Text>
                  )}
                </View>
              </View>

              {/* National Rates Box */}
              <View style={[styles.posterSideBox, { borderColor: '#dc2626' }]}>
                <View style={[styles.posterSideBoxHeader, { backgroundColor: '#dc2626' }]}>
                  <Text style={styles.posterSideBoxHeaderTitle}>🇮🇳 NATIONAL RATES</Text>
                </View>
                <View style={styles.posterSideBoxBody}>
                  {selectedCropForShare.nationalAvgRate != null ? (
                    <>
                      <Text style={[styles.posterSideAvgVal, { color: '#dc2626' }]}>{formatInr(selectedCropForShare.nationalAvgRate)}</Text>
                      <Text style={styles.posterSideMinMax}>
                        Min: {formatInr(selectedCropForShare.nationalMinRate!)}  |  Max: {formatInr(selectedCropForShare.nationalMaxRate!)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.posterDash}>-</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Total Voucher Amount Main Crop Card (Red Border Box) */}
            <View style={styles.posterMainCropAmountBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>🌱</Text>
                  <Text style={styles.posterMainCropTitle}>{selectedCropForShare.displayTitle}</Text>
                </View>
                <Text style={styles.posterMainCropPrice}>
                  {formatInr(selectedCropForShare.localAvgRate ?? selectedCropForShare.nationalAvgRate ?? 0)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <Text style={styles.posterMainSubText}>📝 Unit: Per {selectedCropForShare.unit}</Text>
                <Text style={styles.posterMainLiveText}>⏱️ 24H Verified Rate</Text>
              </View>
            </View>

            {/* Bottom Footer Note */}
            <View style={styles.posterFooterVoucherNote}>
              <Text style={styles.posterFooterVoucherText}>Computer Generated Official Rate Card - FarmsKing Platform</Text>
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
    padding: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
    gap: 12,
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
    opacity: 0.16,
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
    height: 4,
    backgroundColor: '#dc2626',
    borderRadius: RADIUS.pill,
    marginBottom: -4,
  },
  posterVoucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    borderBottomWidth: 1,
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
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
  },
  posterVchBrandSub: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  posterOfficialPill: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  posterOfficialText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  posterRedPillBanner: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    alignSelf: 'center',
    marginVertical: 4,
  },
  posterRedPillText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  posterSideBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  posterSideBoxHeader: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  posterSideBoxHeaderTitle: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  posterSideBoxBody: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterSideAvgVal: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
  },
  posterSideMinMax: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  posterMainCropAmountBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 2,
  },
  posterMainCropTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  posterMainCropPrice: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
  },
  posterMainSubText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  posterMainLiveText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  posterFooterVoucherNote: {
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  posterFooterVoucherText: {
    fontSize: 9.5,
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
