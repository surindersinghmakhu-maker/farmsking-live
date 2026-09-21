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

  const subcategoryRates = useMemo(() => {
    if (!data?.rates || data.rates.length === 0) {
      return [];
    }

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

    const userRefCode = user?.kingId ? user.kingId : 'FARMSKING';
    const shareLink = userRefCode
      ? `https://farmsking-1.vercel.app/register?ref=${userRefCode}`
      : `https://farmsking-1.vercel.app`;

    const u = crop.unit ? ` / ${crop.unit}` : '';
    const localMinStr = crop.localMinRate != null ? `${formatInr(crop.localMinRate)}${u}` : '-';
    const localMaxStr = crop.localMaxRate != null ? `${formatInr(crop.localMaxRate)}${u}` : '-';
    const localAvgStr = crop.localAvgRate != null ? `${formatInr(crop.localAvgRate)}${u}` : '-';

    const natMinStr = crop.nationalMinRate != null ? `${formatInr(crop.nationalMinRate)}${u}` : '-';
    const natMaxStr = crop.nationalMaxRate != null ? `${formatInr(crop.nationalMaxRate)}${u}` : '-';
    const natAvgStr = crop.nationalAvgRate != null ? `${formatInr(crop.nationalAvgRate)}${u}` : '-';

    const textMessage =
      `🌾 *FarmsKing — Live Market Price Card* 📊\n` +
      `🌱 *Crop Name:* ${crop.displayTitle}\n` +
      `📅 *Date & Time:* ${todayDateStr}, ${currentTimeStr}\n\n` +
      `🏛️ *LOCAL PRICE (${userState}):*\n` +
      `• Average: ${localAvgStr}\n` +
      `• Minimum: ${localMinStr}\n` +
      `• Maximum: ${localMaxStr}\n\n` +
      `🇮🇳 *NATIONAL PRICE (All India):*\n` +
      `• Average: ${natAvgStr}\n` +
      `• Minimum: ${natMinStr}\n` +
      `• Maximum: ${natMaxStr}\n\n` +
      `📲 *Use FarmsKing App to stay updated with your crop's live market prices!*\n` +
      `📱 *अपनी फसल के लाइव मार्केट भाव से अपडेट रहने के लिए FarmsKing App का उपयोग करें!*\n\n` +
      `🎁 *Use this referral code for Welcome Bonus:* \`${userRefCode}\`\n` +
      `🎁 *वेलकम बोनस प्राप्त करने के लिए यह रेफरल कोड दर्ज करें:* \`${userRefCode}\`\n` +
      `👉 Register Link: ${shareLink}`;

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

    return `${cleanCropName}_PriceCard_${dateStr}_${timeStr}.png`;
  };

  // Web Canvas poster generator
  const generateWebImageCard = (crop: CropRateItem) => {
    try {
      const now = new Date();
      const todayDateStr = now.toISOString().split('T')[0];
      const canvas = document.createElement('canvas');
      const userRefCode = user?.kingId ? user.kingId : 'FARMSKING';

      canvas.width = 640;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 640, 600);

      // Outer Border
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 640, 600);

      // Top Accent
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 0, 480, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(480, 0, 160, 6);

      // Watermark Grid
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 22px sans-serif';
      ctx.rotate((-15 * Math.PI) / 180);
      for (let y = -100; y < 800; y += 80) {
        for (let x = -200; x < 800; x += 190) {
          ctx.fillText('👑 FarmsKing', x, y);
        }
      }
      ctx.restore();

      // Header Row (Clean Date on Left, NO PRC NUMBER)
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(todayDateStr, 24, 40);

      // Header Center: Brand Logo
      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 FarmsKing', 320, 36);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Smart Farming, Live Mandi Rates', 320, 54);
      ctx.textAlign = 'left';

      // Header Right: Verified Badge
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(530, 24, 84, 24);
      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('VERIFIED', 542, 40);

      // Title Banner
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(140, 72, 360, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌾 LIVE CROP MARKET PRICE CARD 🌾', 320, 93);
      ctx.textAlign = 'left';

      // Crop Info Box (Clean Crop Name ONLY - No unit & no state in title)
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.fillRect(24, 116, 592, 40);
      ctx.strokeRect(24, 116, 592, 40);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`🌱 Crop Name: ${crop.displayTitle}`, 36, 142);

      // UNIFIED 2-COLUMN PRICE CARD GRID (Local & National in 1 Card)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.fillRect(24, 168, 592, 215);
      ctx.strokeRect(24, 168, 592, 215);

      // Grid Header Split (50/50)
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(24, 168, 296, 32);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(320, 168, 296, 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`🏛️ LOCAL PRICE (${userState})`, 36, 189);
      ctx.fillText('🇮🇳 NATIONAL PRICE (All India)', 332, 189);

      // Vertical Divider Line in Card
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(320, 168);
      ctx.lineTo(320, 383);
      ctx.stroke();

      const unitText = crop.unit || 'Quintal';
      const localAvg = crop.localAvgRate != null ? `₹${crop.localAvgRate.toLocaleString('en-IN')} / ${unitText}` : '-';
      const localMin = crop.localMinRate != null ? `₹${crop.localMinRate.toLocaleString('en-IN')} / ${unitText}` : '-';
      const localMax = crop.localMaxRate != null ? `₹${crop.localMaxRate.toLocaleString('en-IN')} / ${unitText}` : '-';

      const natAvg = crop.nationalAvgRate != null ? `₹${crop.nationalAvgRate.toLocaleString('en-IN')} / ${unitText}` : '-';
      const natMin = crop.nationalMinRate != null ? `₹${crop.nationalMinRate.toLocaleString('en-IN')} / ${unitText}` : '-';
      const natMax = crop.nationalMaxRate != null ? `₹${crop.nationalMaxRate.toLocaleString('en-IN')} / ${unitText}` : '-';

      // Row 1: Average Price
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Average Price:', 36, 222);
      ctx.fillText('Average Price:', 332, 222);

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(localAvg, 36, 244);
      ctx.fillStyle = '#0284c7';
      ctx.fillText(natAvg, 332, 244);

      // Horizontal Row Divider 1
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(36, 258);
      ctx.lineTo(604, 258);
      ctx.stroke();

      // Row 2: Minimum Price
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Minimum Price:', 36, 280);
      ctx.fillText('Minimum Price:', 332, 280);

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(localMin, 36, 300);
      ctx.fillText(natMin, 332, 300);

      // Horizontal Row Divider 2
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(36, 314);
      ctx.lineTo(604, 314);
      ctx.stroke();

      // Row 3: Maximum Price
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Maximum Price:', 36, 336);
      ctx.fillText('Maximum Price:', 332, 336);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(localMax, 36, 356);
      ctx.fillText(natMax, 332, 356);

      // App Update CTA Banner (English + Hindi Row)
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 1.5;
      ctx.fillRect(24, 396, 592, 54);
      ctx.strokeRect(24, 396, 592, 54);

      ctx.fillStyle = '#166534';
      ctx.font = 'bold 11.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("📲 Use FarmsKing App to stay updated with your crop's live market prices!", 320, 416);
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('📱 अपनी फसल के लाइव मार्केट भाव से अपडेट रहने के लिए FarmsKing App का उपयोग करें!', 320, 436);
      ctx.textAlign = 'left';

      // Bottom Referral Voucher Box (English + Hindi)
      ctx.fillStyle = '#fffbe6';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.fillRect(24, 460, 592, 88);
      ctx.strokeRect(24, 460, 592, 88);

      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🎁 REFERRAL WELCOME VOUCHER 🎟️', 36, 480);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11.5px sans-serif';
      ctx.fillText('Use this code for Welcome Bonus in wallet:', 36, 502);
      ctx.fillStyle = '#92400e';
      ctx.font = '10.5px sans-serif';
      ctx.fillText('वेलकम बोनस प्राप्त करने के लिए यह रेफरल कोड दर्ज करें:', 36, 524);

      // Code Badge Box
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(415, 492, 185, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(userRefCode, 507, 517);
      ctx.textAlign = 'left';

      // Bottom Footer
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Computer Generated Official Rate Card - FarmsKing Platform', 320, 578);
      ctx.textAlign = 'left';

      const dataUrl = canvas.toDataURL('image/png');
      const fileName = getCropRateFileName(crop.displayTitle);

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Alert.alert('Success 🖼️', `${crop.displayTitle} Price Card downloaded as ${fileName}! You can now share it on WhatsApp.`);
    } catch (err) {
      console.error('Web Canvas image generation error:', err);
      Alert.alert('Error', 'Failed to generate web image card.');
    }
  };

  const handleShareImage = async (crop: CropRateItem) => {
    setIsSharingImage(true);

    if (Platform.OS === 'web') {
      generateWebImageCard(crop);
      setIsSharingImage(false);
      setSelectedCropForShare(null);
      return;
    }

    try {
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
              dialogTitle: `Share ${crop.displayTitle} Price Card (${fileName})`,
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

  const userRefCode = user?.kingId ? user.kingId : 'FARMSKING';

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BrandLogo size={22} useHdQuality style={{ marginRight: 4 }} />
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

                  {/* 4. Share Button */}
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

      {/* App Update Banner in UI Card */}
      <View style={styles.uiCtaBanner}>
        <Ionicons name="phone-portrait-outline" size={13} color="#166534" />
        <Text style={styles.uiCtaText} numberOfLines={1}>
          Tuhadi crop da live market price naal update rehan lyi FarmsKing app use kro!
        </Text>
      </View>

      {/* Referral Voucher Box in UI Card */}
      <View style={styles.uiReferralBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 13 }}>🎁</Text>
          <Text style={styles.uiReferralLabel}>Welcome bonus lyi eh code use kro:</Text>
        </View>
        <View style={styles.uiCodeBadge}>
          <Text style={styles.uiCodeBadgeText}>{userRefCode}</Text>
        </View>
      </View>

      {/* Share Options Modal */}
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
                <Text style={styles.modalTitle}>Share {selectedCropForShare?.displayTitle} Price Card</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCropForShare(null)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>How would you like to share this compact price card?</Text>

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
                <Text style={styles.optionSub}>Formatted text with Min, Max & Avg prices + Referral Voucher</Text>
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
                <Text style={styles.optionSub}>Compact branded FarmsKing price card image with Referral Voucher</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Offscreen ViewShot Poster Component (Mobile PNG Export) */}
      {selectedCropForShare && (
        <View style={styles.offscreenContainer}>
          <ViewShot ref={posterRef} options={{ format: 'png', quality: 0.95 }} style={styles.posterCard}>
            {/* Top Accent */}
            <View style={styles.posterTopGreenStripe} />

            {/* Watermark Grid */}
            <View style={styles.posterWatermarkGridContainer} pointerEvents="none">
              {Array.from({ length: 9 }).map((_, rowIndex) => (
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

            {/* Header Row (NO PRC NUMBER - Clean Date on Left) */}
            <View style={styles.posterVoucherHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.posterVchDate}>
                  {new Date().toISOString().split('T')[0]}
                </Text>
              </View>

              <View style={{ flex: 1.8, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrandLogo size={28} useGoldRing />
                  <Text style={styles.posterVchBrandTitle}>FarmsKing</Text>
                </View>
                <Text style={styles.posterVchBrandSub}>Smart Farming, Live Mandi Rates</Text>
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={styles.posterOfficialPill}>
                  <Text style={styles.posterOfficialText}>VERIFIED</Text>
                </View>
              </View>
            </View>

            {/* Title Banner */}
            <View style={styles.posterRedPillBanner}>
              <Text style={styles.posterRedPillText}>🌾 LIVE CROP MARKET PRICE CARD 🌾</Text>
            </View>

            {/* Crop Header Box (Clean Crop Name ONLY - No unit & state in title) */}
            <View style={styles.posterCropHeaderBox}>
              <Text style={styles.posterCropTitleText}>
                🌱 Crop Name: <Text style={{ fontFamily: FONT.extraBold, color: '#16a34a' }}>{selectedCropForShare.displayTitle}</Text>
              </Text>
            </View>

            {/* UNIFIED 2-COLUMN PRICE CARD GRID (Local & National in 1 Card) */}
            <View style={styles.posterUnifiedCardBox}>
              <View style={styles.posterGridHeaderRow}>
                <View style={[styles.posterGridHeaderCol, { backgroundColor: '#16a34a' }]}>
                  <Text style={styles.posterGridHeaderTitle}>🏛️ LOCAL ({userState})</Text>
                </View>
                <View style={[styles.posterGridHeaderCol, { backgroundColor: '#0284c7' }]}>
                  <Text style={styles.posterGridHeaderTitle}>🇮🇳 NATIONAL (All India)</Text>
                </View>
              </View>

              <View style={styles.posterGridBody}>
                {/* Row 1: Average Price */}
                <View style={styles.posterGridCellRow}>
                  <View style={styles.posterGridCell}>
                    <Text style={styles.posterCellLabel}>Average Price:</Text>
                    <Text style={[styles.posterCellVal, { color: '#16a34a' }]}>
                      {selectedCropForShare.localAvgRate != null ? `${formatInr(selectedCropForShare.localAvgRate)} / ${selectedCropForShare.unit}` : '-'}
                    </Text>
                  </View>
                  <View style={styles.posterCellDivider} />
                  <View style={styles.posterGridCell}>
                    <Text style={styles.posterCellLabel}>Average Price:</Text>
                    <Text style={[styles.posterCellVal, { color: '#0284c7' }]}>
                      {selectedCropForShare.nationalAvgRate != null ? `${formatInr(selectedCropForShare.nationalAvgRate)} / ${selectedCropForShare.unit}` : '-'}
                    </Text>
                  </View>
                </View>

                {/* Row 2: Minimum Price */}
                <View style={styles.posterGridCellRow}>
                  <View style={styles.posterGridCell}>
                    <Text style={styles.posterCellLabel}>Minimum Price:</Text>
                    <Text style={[styles.posterCellValSub, { color: '#15803d' }]}>
                      {selectedCropForShare.localMinRate != null ? `${formatInr(selectedCropForShare.localMinRate)} / ${selectedCropForShare.unit}` : '-'}
                    </Text>
                  </View>
                  <View style={styles.posterCellDivider} />
                  <View style={styles.posterGridCell}>
                    <Text style={styles.posterCellLabel}>Minimum Price:</Text>
                    <Text style={[styles.posterCellValSub, { color: '#15803d' }]}>
                      {selectedCropForShare.nationalMinRate != null ? `${formatInr(selectedCropForShare.nationalMinRate)} / ${selectedCropForShare.unit}` : '-'}
                    </Text>
                  </View>
                </View>

                {/* Row 3: Maximum Price */}
                <View style={styles.posterGridCellRow}>
                  <View style={styles.posterGridCell}>
                    <Text style={styles.posterCellLabel}>Maximum Price:</Text>
                    <Text style={[styles.posterCellValSub, { color: '#dc2626' }]}>
                      {selectedCropForShare.localMaxRate != null ? `${formatInr(selectedCropForShare.localMaxRate)} / ${selectedCropForShare.unit}` : '-'}
                    </Text>
                  </View>
                  <View style={styles.posterCellDivider} />
                  <View style={styles.posterGridCell}>
                    <Text style={styles.posterCellLabel}>Maximum Price:</Text>
                    <Text style={[styles.posterCellValSub, { color: '#dc2626' }]}>
                      {selectedCropForShare.nationalMaxRate != null ? `${formatInr(selectedCropForShare.nationalMaxRate)} / ${selectedCropForShare.unit}` : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* App CTA Text Banner (English + Hindi) */}
            <View style={styles.posterAppCtaBox}>
              <Text style={styles.posterAppCtaTextEnglish}>
                📲 Use FarmsKing App to stay updated with your crop's live market prices!
              </Text>
              <Text style={styles.posterAppCtaTextHindi}>
                📱 अपनी फसल के लाइव मार्केट भाव से अपडेट रहने के लिए FarmsKing App का उपयोग करें!
              </Text>
            </View>

            {/* Bottom Referral Voucher Card (English + Hindi) */}
            <View style={styles.posterVoucherCardBox}>
              <View style={styles.posterVoucherTopRow}>
                <Text style={{ fontSize: 13 }}>🎁</Text>
                <Text style={styles.posterVoucherTitle}>REFERRAL WELCOME VOUCHER</Text>
                <Text style={{ fontSize: 13 }}>🎟️</Text>
              </View>
              <View style={styles.posterVoucherBodyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.posterVoucherTextEng}>Use this code for Welcome Bonus:</Text>
                  <Text style={styles.posterVoucherTextHindi}>कौन बोनस के लिए यह कोड दर्ज करें:</Text>
                </View>
                <View style={styles.posterVoucherCodeBadge}>
                  <Text style={styles.posterVoucherCodeText}>{userRefCode}</Text>
                </View>
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
  cropColumn: { flex: 0.9 },
  rateColumn: { flex: 1.1, alignItems: 'flex-start' },
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
  rateDetailBox: {
    gap: 1,
  },
  rateLabelPrefix: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  rateValueAvg: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: theme.primary,
  },
  minMaxRow: {
    flexDirection: 'column',
    gap: 1,
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
  uiCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  uiCtaText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#166534',
    flex: 1,
  },
  uiCtaTextEnglish: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  uiCtaTextHindi: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#15803d',
    marginTop: 1,
  },
  uiReferralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbe6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  uiReferralLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  uiReferralLabelEng: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  uiReferralLabelHindi: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#b45309',
  },
  uiCodeBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  uiCodeBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
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
    padding: 12,
    borderWidth: 2,
    borderColor: '#16a34a',
    gap: 8,
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
    opacity: 0.07,
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
  posterTopGreenStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#16a34a',
  },
  posterVoucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  posterVchDate: {
    fontSize: 10,
    fontFamily: FONT.bold,
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
    borderColor: '#16a34a',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  posterOfficialText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  posterRedPillBanner: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'center',
    marginVertical: 2,
  },
  posterRedPillText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  posterCropHeaderBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 8,
  },
  posterCropTitleText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  posterUnifiedCardBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  posterGridHeaderRow: {
    flexDirection: 'row',
    width: '100%',
  },
  posterGridHeaderCol: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  posterGridHeaderTitle: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  posterGridBody: {
    padding: 6,
    gap: 4,
  },
  posterGridCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  posterGridCell: {
    flex: 1,
    gap: 1,
  },
  posterCellDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  posterCellLabel: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  posterCellVal: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
  },
  posterCellValSub: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  posterAppCtaBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 6,
    gap: 2,
    alignItems: 'center',
  },
  posterAppCtaTextEnglish: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#166534',
    textAlign: 'center',
  },
  posterAppCtaTextHindi: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#15803d',
    textAlign: 'center',
  },
  posterVoucherCardBox: {
    backgroundColor: '#fffbe6',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: 8,
    gap: 4,
  },
  posterVoucherTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  posterVoucherTitle: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#b45309',
    letterSpacing: 0.3,
  },
  posterVoucherBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posterVoucherTextEng: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  posterVoucherTextHindi: {
    fontSize: 8,
    fontFamily: FONT.medium,
    color: '#92400e',
  },
  posterVoucherCodeBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  posterVoucherCodeText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  posterFooterVoucherNote: {
    alignItems: 'center',
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  posterFooterVoucherText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  posterFooterVoucherSub: {
    fontSize: 8,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
});
