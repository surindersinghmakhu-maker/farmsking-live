import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, Pressable, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { BrandLogo } from './BrandLogo';
import { useMyCropRates } from '../hooks/useMarketRates';
import { useAuth } from '../store/auth-context';
import { useCrops } from '../store/crops-context';
import { useAppSettings } from '../hooks/useAppSettings';
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
  const { data: settingsData } = useAppSettings();

  const bonusAmount = settingsData?.referralSignupBonusAmount ?? settingsData?.newUserSignupBonusAmount ?? 10;

  const [selectedCropForShare, setSelectedCropForShare] = useState<CropRateItem | null>(null);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const posterRef = useRef<any>(null);

  const userState = user?.state || data?.state || 'Punjab';

  // Calculate 24h Min, Max & Avg for State level and National level for crops.
  // Calculate 24h Min, Max & Avg for State level and National level for active crops of logged in farmer.
  const subcategoryRates = useMemo(() => {
    const userCropUnitMap = new Map<string, string>();
    const userCropDisplayNameMap = new Map<string, string>();
    const allUserCropNames = new Set<string>();

    (cropFields || []).forEach((c) => {
      let baseName = c.cropName.split('(')[0].trim();
      if (c.variety && baseName.toLowerCase().includes(c.variety.toLowerCase())) {
        baseName = baseName.replace(new RegExp(c.variety, 'gi'), '').trim();
      }
      const key = baseName.toLowerCase();
      allUserCropNames.add(key);
      userCropDisplayNameMap.set(key, c.cropName.split('(')[0].trim());
      userCropUnitMap.set(key, c.unit || 'KG');
    });

    if (allUserCropNames.size === 0) {
      // Logged in farmer has no active crops added
      return [];
    }

    const ratesList = data?.rates || [];

    // Filter rates: ONLY include rates for crops present in logged in farmer's active crops
    const ratesMap = new Map<string, (typeof ratesList)[0]>();
    ratesList.forEach((r) => {
      const cropKey = r.cropName.split('(')[0].trim().toLowerCase();
      if (allUserCropNames.has(cropKey)) {
        ratesMap.set(cropKey, r);
      }
    });

    const items: CropRateItem[] = [];

    allUserCropNames.forEach((cropKey) => {
      const r = ratesMap.get(cropKey);
      const userUnit = userCropUnitMap.get(cropKey);
      const displayTitle = userCropDisplayNameMap.get(cropKey) || (r ? r.cropName : cropKey.toUpperCase());
      const sourceUnit = r?.unit || 'KG';
      const targetUnit = userUnit || (r?.cropName === 'Wheat' || r?.cropName === 'Paddy' ? 'Quintal' : 'KG');

      const localAvgRate =
        r?.localAvgRate != null && r.localAvgRate > 0
          ? convertRateForCropUnit(r.localAvgRate, sourceUnit, targetUnit)
          : null;

      const localMinRate =
        localAvgRate != null
          ? convertRateForCropUnit(r?.localMinRate ?? r?.localAvgRate!, sourceUnit, targetUnit)
          : null;

      const localMaxRate =
        localAvgRate != null
          ? convertRateForCropUnit(r?.localMaxRate ?? r?.localAvgRate!, sourceUnit, targetUnit)
          : null;

      const nationalAvgRate =
        r?.nationalAvgRate != null && r.nationalAvgRate > 0
          ? convertRateForCropUnit(r.nationalAvgRate, sourceUnit, targetUnit)
          : null;

      const nationalMinRate =
        nationalAvgRate != null
          ? convertRateForCropUnit(r?.nationalMinRate ?? r?.nationalAvgRate!, sourceUnit, targetUnit)
          : null;

      const nationalMaxRate =
        nationalAvgRate != null
          ? convertRateForCropUnit(r?.nationalMaxRate ?? r?.nationalAvgRate!, sourceUnit, targetUnit)
          : null;

      items.push({
        displayTitle,
        unit: targetUnit,
        localMinRate,
        localMaxRate,
        localAvgRate,
        nationalMinRate,
        nationalMaxRate,
        nationalAvgRate,
      });
    });

    return items;
  }, [cropFields, data]);

  // Handler for sharing crop rates as Text
  const handleShareText = async (crop: CropRateItem) => {
    setSelectedCropForShare(null);

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const todayDateStr = `${dd}/${mm}/${yy}`;
    const currentTimeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const userRefCode = user?.kingId ? user.kingId : 'FARMSKING';
    const shareLink = userRefCode
      ? `https://farmsking-1.vercel.app/register?ref=${userRefCode}`
      : `https://farmsking-1.vercel.app`;

    const unitTag = crop.unit ? ` / ${crop.unit}` : '';
    const localMinStr = crop.localMinRate != null ? `${formatInr(crop.localMinRate)}${unitTag}` : '-';
    const localMaxStr = crop.localMaxRate != null ? `${formatInr(crop.localMaxRate)}${unitTag}` : '-';
    const localAvgStr = crop.localAvgRate != null ? `${formatInr(crop.localAvgRate)}${unitTag}` : '-';

    const natMinStr = crop.nationalMinRate != null ? `${formatInr(crop.nationalMinRate)}${unitTag}` : '-';
    const natMaxStr = crop.nationalMaxRate != null ? `${formatInr(crop.nationalMaxRate)}${unitTag}` : '-';
    const natAvgStr = crop.nationalAvgRate != null ? `${formatInr(crop.nationalAvgRate)}${unitTag}` : '-';

    const textMessage =
      `🌾 *FarmsKing — Live Market Price Card* 📊\n` +
      `🌱 *Crop Name:* ${crop.displayTitle}\n` +
      `📅 *Date & Time:* ${todayDateStr} ${currentTimeStr}\n\n` +
      `🏛️ *LOCAL PRICE (${userState}):*\n` +
      `• Minimum: ${localMinStr}\n` +
      `• Maximum: ${localMaxStr}\n` +
      `• Average: ${localAvgStr}\n\n` +
      `🇮🇳 *ALL INDIA PRICE:*\n` +
      `• Minimum: ${natMinStr}\n` +
      `• Maximum: ${natMaxStr}\n` +
      `• Average: ${natAvgStr}\n\n` +
      `📲 *Use FarmsKing App to stay updated with your crop's live market prices!*\n\n` +
      `🎁 *Use code to REGISTER & get Rs. ${bonusAmount}:* \`${userRefCode}\`\n` +
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

    return `${cleanCropName}_PriceCard_${dateStr}_${timeStr}.png`;
  };

  // Helper for generating high quality image card poster on Web browsers
  const generateWebImageCard = async (crop: CropRateItem) => {
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const todayDateStr = `${dd}/${mm}/${yy}`;
      const currentTimeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const logoImg = new window.Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = require('../../assets/images/farmsking_logo_hd.png');

      await new Promise((resolve) => {
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          resolve(null);
        } else {
          logoImg.onload = () => resolve(null);
          logoImg.onerror = () => resolve(null);
        }
      });

      const canvas = document.createElement('canvas');
      const userRefCode = user?.kingId ? user.kingId : 'FARMSKING';

      const W = 640;
      const H = 570;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Premium Soft Gradient Card Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
      bgGradient.addColorStop(0, '#ffffff');
      bgGradient.addColorStop(1, '#f8fafc');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

      // 2. Outer Emerald Card Border
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, W, H);

      // 3. Dual Top Stripe Accent (Green 75%, Red 25%)
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 0, 480, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(480, 0, 160, 6);

      // 4. Ultra-Subtle Watermark Grid (FarmsKing Logo + Text)
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 18px sans-serif';
      ctx.rotate((-15 * Math.PI) / 180);
      for (let y = -100; y < 850; y += 85) {
        for (let x = -200; x < 850; x += 190) {
          if (logoImg.naturalWidth > 0) {
            ctx.drawImage(logoImg, x, y - 16, 20, 20);
            ctx.fillText('FarmsKing', x + 24, y);
          } else {
            ctx.fillText('👑 FarmsKing', x, y);
          }
        }
      }
      ctx.restore();

      // 5. Header Row (Date & Time Pill on Left)
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 1.5;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(24, 20, 165, 30, 15);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(24, 20, 165, 30);
        ctx.strokeRect(24, 20, 165, 30);
      }

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 11.5px sans-serif';
      ctx.fillText(`🕒 ${todayDateStr}  ${currentTimeStr}`, 32, 39);

      // Header Center: Official Brand Logo + Title + Tagline
      if (logoImg.naturalWidth > 0) {
        ctx.drawImage(logoImg, 215, 14, 38, 38);
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('FarmsKing', 260, 39);
        ctx.fillStyle = '#64748b';
        ctx.font = '500 11px sans-serif';
        ctx.fillText('Smart Farming • Live Mandi Rates', 260, 53);
      } else {
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑 FarmsKing', 320, 34);
        ctx.fillStyle = '#64748b';
        ctx.font = '500 11px sans-serif';
        ctx.fillText('Smart Farming • Live Mandi Rates', 320, 51);
        ctx.textAlign = 'left';
      }

      // 6. Green Heading Pill Banner (Ratecard Aligned & Clear)
      ctx.fillStyle = '#16a34a';
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(110, 64, 420, 30, 15);
        ctx.fill();
      } else {
        ctx.fillRect(110, 64, 420, 30);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌾 DAILY LIVE CROP MANDI RATE CARD 🌾', 320, 84);
      ctx.textAlign = 'left';

      // 7. Crop Info Header Container (Vibrant Emerald Box)
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(24, 106, 592, 46, 10);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(24, 106, 592, 46);
        ctx.strokeRect(24, 106, 592, 46);
      }

      ctx.fillStyle = '#166534';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('🌱 CROP NAME:', 38, 134);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 20px sans-serif';
      ctx.fillText(crop.displayTitle, 148, 135);

      const titleWidth = ctx.measureText(crop.displayTitle).width;
      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`(Per ${crop.unit})`, 160 + titleWidth, 134);

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('📍 Live Mandi', 600, 134);
      ctx.textAlign = 'left';

      const localAvg = crop.localAvgRate != null ? `₹${crop.localAvgRate.toLocaleString('en-IN')}` : '-';
      const localMin = crop.localMinRate != null ? `₹${crop.localMinRate.toLocaleString('en-IN')}` : '-';
      const localMax = crop.localMaxRate != null ? `₹${crop.localMaxRate.toLocaleString('en-IN')}` : '-';

      const natAvg = crop.nationalAvgRate != null ? `₹${crop.nationalAvgRate.toLocaleString('en-IN')}` : '-';
      const natMin = crop.nationalMinRate != null ? `₹${crop.nationalMinRate.toLocaleString('en-IN')}` : '-';
      const natMax = crop.nationalMaxRate != null ? `₹${crop.nationalMaxRate.toLocaleString('en-IN')}` : '-';

      // 8 & 9. UNIFIED HIGH-CONTRAST VIBRANT MANDI PRICE TABLE
      const tableX = 24;
      const tableY = 166;
      const tableW = 592;
      const tableH = 154;

      // Outer Table Border
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(tableX, tableY, tableW, tableH, 10);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(tableX, tableY, tableW, tableH);
        ctx.strokeRect(tableX, tableY, tableW, tableH);
      }

      // Dark Navy High-Contrast Header Bar
      ctx.fillStyle = '#0f172a';
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(tableX, tableY, tableW, 32, [10, 10, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(tableX, tableY, tableW, 32);
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 11px sans-serif';
      ctx.fillText('MARKET LEVEL', tableX + 16, tableY + 20);
      ctx.fillText('AVERAGE RATE', tableX + 215, tableY + 20);
      ctx.fillText('MIN — MAX RATE', tableX + 420, tableY + 20);

      // --- ROW 1: LOCAL MANDI (Soft Emerald Background Card) ---
      const row1Y = tableY + 34;
      const rowH = 58;

      ctx.fillStyle = '#f0fdf4'; // Light Emerald Tint
      ctx.fillRect(tableX + 2, row1Y, tableW - 4, rowH);

      // Left Market Pill Badge
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(tableX + 10, row1Y + 11, 180, 34, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(tableX + 10, row1Y + 11, 180, 34);
      }
      ctx.fillStyle = '#166534';
      ctx.font = '800 12.5px sans-serif';
      ctx.fillText(`🏛️ LOCAL (${userState.toUpperCase()})`, tableX + 18, row1Y + 32);

      // Center Average Price Pill Box (Super Vibrant Emerald Pill)
      ctx.fillStyle = '#16a34a';
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(tableX + 205, row1Y + 10, 185, 36, 18);
        ctx.fill();
      } else {
        ctx.fillRect(tableX + 205, row1Y + 10, 185, 36);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 18.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${localAvg} / ${crop.unit}`, tableX + 297, row1Y + 33);
      ctx.textAlign = 'left';

      // Right Min - Max Range
      ctx.fillStyle = '#15803d';
      ctx.font = '800 13.5px sans-serif';
      ctx.fillText(localMin, tableX + 420, row1Y + 33);

      const localMinW = ctx.measureText(localMin).width;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(' - ', tableX + 422 + localMinW, row1Y + 33);

      ctx.fillStyle = '#dc2626';
      ctx.font = '800 13.5px sans-serif';
      ctx.fillText(localMax, tableX + 437 + localMinW, row1Y + 33);

      // Row Divider Line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX + 8, row1Y + rowH);
      ctx.lineTo(tableX + tableW - 8, row1Y + rowH);
      ctx.stroke();

      // --- ROW 2: ALL INDIA (Soft Sky Blue Background Card) ---
      const row2Y = row1Y + rowH + 1;

      ctx.fillStyle = '#f0f9ff'; // Light Sky Blue Tint
      ctx.fillRect(tableX + 2, row2Y, tableW - 4, rowH - 2);

      // Left Market Pill Badge
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(tableX + 10, row2Y + 11, 180, 34, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(tableX + 10, row2Y + 11, 180, 34);
      }
      ctx.fillStyle = '#0369a1';
      ctx.font = '800 12.5px sans-serif';
      ctx.fillText('🇮🇳 ALL INDIA', tableX + 18, row2Y + 32);

      // Center Average Price Pill Box (Super Vibrant Ocean Blue Pill)
      ctx.fillStyle = '#0284c7';
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(tableX + 205, row2Y + 10, 185, 36, 18);
        ctx.fill();
      } else {
        ctx.fillRect(tableX + 205, row2Y + 10, 185, 36);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 18.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${natAvg} / ${crop.unit}`, tableX + 297, row2Y + 33);
      ctx.textAlign = 'left';

      // Right Min - Max Range
      ctx.fillStyle = '#15803d';
      ctx.font = '800 13.5px sans-serif';
      ctx.fillText(natMin, tableX + 420, row2Y + 33);

      const natMinW = ctx.measureText(natMin).width;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(' - ', tableX + 422 + natMinW, row2Y + 33);

      ctx.fillStyle = '#dc2626';
      ctx.font = '800 13.5px sans-serif';
      ctx.fillText(natMax, tableX + 437 + natMinW, row2Y + 33);

      // 9. App Update Call To Action Banner
      const ctaY = tableY + tableH + 12;
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 1.5;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(24, ctaY, 592, 36, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(24, ctaY, 592, 36);
        ctx.strokeRect(24, ctaY, 592, 36);
      }

      ctx.fillStyle = '#166534';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("📲 Use FarmsKing App to stay updated with your crop's live market prices!", 320, ctaY + 23);
      ctx.textAlign = 'left';

      // 10. Official Welcome Bonus Voucher Container
      const vchY = ctaY + 48;
      ctx.fillStyle = '#fffdf0';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(24, vchY, 592, 90, 10);
        ctx.fill();
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillRect(24, vchY, 592, 90);
        ctx.strokeRect(24, vchY, 592, 90);
      }

      // Voucher Header Banner Bar
      ctx.fillStyle = '#fef3c7';
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(24, vchY, 592, 25, [10, 10, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(24, vchY, 592, 25);
      }
      ctx.fillStyle = '#b45309';
      ctx.font = '800 11.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎟️ OFFICIAL WELCOME BONUS VOUCHER 🎟️', 320, vchY + 17);
      ctx.textAlign = 'left';

      // Voucher Body Left: Offer & Benefit
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Register on FarmsKing App & Get', 38, vchY + 48);

      ctx.fillStyle = '#16a34a'; // Bold Emerald Green for Benefit
      ctx.font = '800 15px sans-serif';
      ctx.fillText(`Rs. ${bonusAmount} FREE BONUS!`, 255, vchY + 49);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 11px sans-serif';
      ctx.fillText('Enter Referral Code during signup on app to claim instant cash benefit', 38, vchY + 71);

      // Voucher Body Right: Code Badge Box
      ctx.fillStyle = '#16a34a';
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(420, vchY + 32, 180, 46, 8);
        ctx.fill();
      } else {
        ctx.fillRect(420, vchY + 32, 180, 46);
      }

      ctx.fillStyle = '#dcfce7';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REFERRAL CODE', 510, vchY + 46);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px monospace';
      ctx.fillText(userRefCode, 510, vchY + 67);
      ctx.textAlign = 'left';

      // 11. Bottom Footer with VERIFIED Badge
      const ftrY = vchY + 106;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Computer Generated Official Rate Card • FarmsKing Platform', 320, ftrY);

      // Bottom Centered VERIFIED Badge Pill
      ctx.fillStyle = '#f0fdf4';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 1.5;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(230, ftrY + 10, 180, 24, 12);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(230, ftrY + 10, 180, 24);
        ctx.strokeRect(230, ftrY + 10, 180, 24);
      }
      ctx.fillStyle = '#16a34a';
      ctx.font = '800 10.5px sans-serif';
      ctx.fillText('✓ VERIFIED DIGITAL RECORD', 320, ftrY + 26);
      ctx.textAlign = 'left';

      const dataUrl = canvas.toDataURL('image/png');
      const fileName = getCropRateFileName(crop.displayTitle);

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Alert.alert('Success 🖼️', `${crop.displayTitle} Price Card poster saved as ${fileName}! You can now share it on WhatsApp.`);
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
    <View style={[styles.card, premiumShadow('#0f172a', 'sm'), { position: 'relative', overflow: 'hidden' }]}>
      {/* Subtle Background Watermark Grid */}
      <View style={styles.posterWatermarkGridContainer} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.posterWatermarkRow}>
            {Array.from({ length: 3 }).map((_, colIndex) => (
              <View key={colIndex} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 4 }}>
                <BrandLogo size={14} useGoldRing />
                <Text style={styles.posterWatermarkTileText}>FarmsKing</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

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
            <Text style={[styles.columnHeader, styles.cropColumn]}>YOUR CROP</Text>
            <Text style={[styles.columnHeader, styles.rateColumn]}>LOCAL ({userState ? userState.toUpperCase() : 'PUNJAB'})</Text>
            <Text style={[styles.columnHeader, styles.rateColumn]}>ALL INDIA</Text>
            <Text style={[styles.columnHeader, styles.shareColumn]}>SHARE</Text>
          </View>

          {/* Subcategory Rates List */}
          {subcategoryRates.length === 0 ? (
            <Text style={[styles.emptyText, { textAlign: 'center', marginVertical: 8 }]}>
              No active crops to show live prices right now.
            </Text>
          ) : (
            subcategoryRates.map((rate) => {
              const hasLocal = rate.localAvgRate != null && rate.localAvgRate > 0;
              const hasNational = rate.nationalAvgRate != null && rate.nationalAvgRate > 0;

              return (
                <View key={rate.displayTitle} style={styles.row}>
                  {/* 1. Crop Name */}
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
                            Min: <Text style={{ fontFamily: FONT.bold, color: '#15803d' }}>{formatInr(rate.localMinRate!)}</Text>
                          </Text>
                          <Text style={styles.maxText}>
                            Max: <Text style={{ fontFamily: FONT.bold, color: '#dc2626' }}>{formatInr(rate.localMaxRate!)}</Text>
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
                            Min: <Text style={{ fontFamily: FONT.bold, color: '#15803d' }}>{formatInr(rate.nationalMinRate!)}</Text>
                          </Text>
                          <Text style={styles.maxText}>
                            Max: <Text style={{ fontFamily: FONT.bold, color: '#dc2626' }}>{formatInr(rate.nationalMaxRate!)}</Text>
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
                    <Ionicons name="share-social-outline" size={16} color="#16a34a" />
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

      {/* Offscreen ViewShot Poster Component for generating Crop Rate Image Card */}
      {selectedCropForShare && (
        <View style={styles.offscreenContainer}>
          <ViewShot ref={posterRef} options={{ format: 'png', quality: 0.95 }} style={styles.posterCard}>
            {/* Top Green & Red Stripe Accent */}
            <View style={styles.posterTopGreenStripe} />

            {/* Tiled Anti-Crop Background Watermark Grid */}
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

            {/* Voucher Header Row (Date formatted as DD/MM/YY + current time highlighted) */}
            {(() => {
              const posterNow = new Date();
              const pDd = String(posterNow.getDate()).padStart(2, '0');
              const pMm = String(posterNow.getMonth() + 1).padStart(2, '0');
              const pYy = String(posterNow.getFullYear()).slice(-2);
              const pDateStr = `${pDd}/${pMm}/${pYy}`;
              const pTimeStr = posterNow.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <View style={styles.posterVoucherHeader}>
                  <View style={{ flex: 1.3 }}>
                    <View style={styles.posterDateTimePill}>
                      <Ionicons name="time-outline" size={11} color="#15803d" />
                      <Text style={styles.posterDateTimePillText}>
                        {pDateStr}  {pTimeStr}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flex: 1.7, alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <BrandLogo size={32} useGoldRing useHdQuality />
                      <Text style={styles.posterVchBrandTitle}>FarmsKing</Text>
                    </View>
                    <Text style={styles.posterVchBrandSub}>Smart Farming, Live Mandi Rates</Text>
                  </View>
                </View>
              );
            })()}

            {/* Green Heading Pill Banner */}
            <View style={styles.posterRedPillBanner}>
              <Text style={styles.posterRedPillText}>🌾 DAILY LIVE CROP MANDI RATE CARD 🌾</Text>
            </View>

            {/* Crop Grid Header (Highlighted Box with Big Bold Title) */}
            <View style={styles.posterCropHeaderBoxHighlight}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>🌱</Text>
                <View>
                  <Text style={styles.posterCropLabelSub}>CROP NAME</Text>
                  <Text style={styles.posterCropTitleHighlight}>
                    {selectedCropForShare.displayTitle} <Text style={styles.posterCropUnitBadge}>(Per {selectedCropForShare.unit})</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.liveMandiPill}>
                <Text style={styles.liveMandiText}>📍 Live Mandi</Text>
              </View>
            </View>

            {/* UNIFIED HIGH-CONTRAST MANDI PRICE TABLE */}
            <View style={styles.posterUnifiedTableBox}>
              <View style={styles.posterTableHeaderRowDark}>
                <Text style={[styles.posterTableColHeaderDark, { flex: 1.25 }]}>MARKET LEVEL</Text>
                <Text style={[styles.posterTableColHeaderDark, { flex: 1.1 }]}>AVERAGE RATE</Text>
                <Text style={[styles.posterTableColHeaderDark, { flex: 1.25, textAlign: 'right' }]}>MIN — MAX RATE</Text>
              </View>

              {/* Row 1: Local (State) Level */}
              <View style={styles.posterTableRowLocal}>
                <View style={{ flex: 1.25 }}>
                  <View style={styles.posterMarketTagLocalBadge}>
                    <Text style={styles.posterMarketTagLocalText}>🏛️ LOCAL ({userState.toUpperCase()})</Text>
                  </View>
                </View>
                <View style={{ flex: 1.1 }}>
                  <View style={styles.posterAvgPillLocal}>
                    <Text style={styles.posterAvgRateWhite}>
                      {selectedCropForShare.localAvgRate != null ? `${formatInr(selectedCropForShare.localAvgRate)}` : '-'}
                      <Text style={styles.posterUnitInlineWhite}>/{selectedCropForShare.unit}</Text>
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1.25, alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={styles.posterMinValTextSmall}>{selectedCropForShare.localMinRate != null ? formatInr(selectedCropForShare.localMinRate) : '-'}</Text>
                    <Text style={{ fontSize: 9.5, color: '#94a3b8' }}>-</Text>
                    <Text style={styles.posterMaxValTextSmall}>{selectedCropForShare.localMaxRate != null ? formatInr(selectedCropForShare.localMaxRate) : '-'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.posterTableDividerLine} />

              {/* Row 2: All India Level */}
              <View style={styles.posterTableRowNational}>
                <View style={{ flex: 1.25 }}>
                  <View style={styles.posterMarketTagNationalBadge}>
                    <Text style={styles.posterMarketTagNationalText}>🇮🇳 ALL INDIA</Text>
                  </View>
                </View>
                <View style={{ flex: 1.1 }}>
                  <View style={styles.posterAvgPillNational}>
                    <Text style={styles.posterAvgRateWhite}>
                      {selectedCropForShare.nationalAvgRate != null ? `${formatInr(selectedCropForShare.nationalAvgRate)}` : '-'}
                      <Text style={styles.posterUnitInlineWhite}>/{selectedCropForShare.unit}</Text>
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1.25, alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={styles.posterMinValTextSmall}>{selectedCropForShare.nationalMinRate != null ? formatInr(selectedCropForShare.nationalMinRate) : '-'}</Text>
                    <Text style={{ fontSize: 9.5, color: '#94a3b8' }}>-</Text>
                    <Text style={styles.posterMaxValTextSmall}>{selectedCropForShare.nationalMaxRate != null ? formatInr(selectedCropForShare.nationalMaxRate) : '-'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* App CTA Text Banner (English ONLY) */}
            <View style={styles.posterAppCtaBox}>
              <Text style={styles.posterAppCtaText}>
                📲 Use FarmsKing App to stay updated with your crop's live market prices!
              </Text>
            </View>

            {/* OFFICIAL WELCOME BONUS VOUCHER CARD */}
            <View style={styles.posterVoucherCardBox}>
              <View style={styles.posterVoucherTopHeader}>
                <Text style={styles.posterVoucherTitle}>🎟️ OFFICIAL WELCOME BONUS VOUCHER 🎟️</Text>
              </View>
              <View style={styles.posterVoucherBodyContainer}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                    <Text style={styles.posterVoucherMainText}>Register on App & Get</Text>
                    <Text style={styles.posterVoucherBenefitHighlight}>Rs. {bonusAmount} FREE BONUS!</Text>
                  </View>
                  <Text style={styles.posterVoucherSubtext}>Enter referral code during signup on app to claim reward</Text>
                </View>
                <View style={styles.posterVoucherCodeBadgeBox}>
                  <Text style={styles.posterVoucherCodeLabel}>REFERRAL CODE</Text>
                  <Text style={styles.posterVoucherCodeText}>{userRefCode}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Footer Note with VERIFIED Badge */}
            <View style={styles.posterFooterVoucherNote}>
              <Text style={styles.posterFooterVoucherText}>
                Computer Generated Official Rate Card • FarmsKing Platform
              </Text>
              <View style={styles.posterOfficialPillBottom}>
                <BrandLogo size={14} useGoldRing useHdQuality />
                <Text style={styles.posterOfficialText}>✓ VERIFIED DIGITAL RECORD</Text>
              </View>
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
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
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
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
  },
  redDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#dc2626',
  },
  liveText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#dc2626',
    letterSpacing: 0.2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  pillText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  spinner: { marginVertical: 8 },
  emptyText: { color: '#64748b', fontSize: 11.5, fontFamily: FONT.medium },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  columnHeader: {
    fontSize: 9.5,
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
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  cropName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  cropUnitSub: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  rateDetailBox: {
    gap: 2,
  },
  rateLabelPrefix: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  rateValueAvg: {
    fontSize: 13,
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
  shareColumn: { width: 36, alignItems: 'center' },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  uiCtaText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  uiCtaTextHindi: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
    marginTop: 1,
  },
  uiReferralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbe6',
    paddingHorizontal: 8,
    paddingVertical: 5,
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
  uiReferralLabelHindi: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#b45309',
    marginTop: 1,
  },
  uiCodeBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 7,
    paddingVertical: 2,
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
    opacity: 0.08,
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
  posterVchNo: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  posterVchDate: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  posterDateTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  posterDateTimePillText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
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
  posterOfficialPillBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
    alignSelf: 'center',
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
  posterCropHeaderBoxHighlight: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posterCropLabelSub: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#166534',
    letterSpacing: 0.3,
  },
  posterCropTitleHighlight: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginTop: 1,
  },
  posterCropUnitBadge: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  liveMandiPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveMandiText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  posterUnifiedTableBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  posterTableHeaderRowDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  posterTableColHeaderDark: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  posterTableRowLocal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  posterTableRowNational: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  posterTableDividerLine: {
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  posterMarketTagLocalBadge: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  posterMarketTagLocalText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#166534',
  },
  posterMarketTagNationalBadge: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  posterMarketTagNationalText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#0369a1',
  },
  posterAvgPillLocal: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  posterAvgPillNational: {
    backgroundColor: '#0284c7',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  posterAvgRateWhite: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  posterUnitInlineWhite: {
    fontSize: 8,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  posterMinValTextSmall: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  posterMaxValTextSmall: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
  },
  posterMinValText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  posterMaxValText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  posterAppCtaBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 6,
    alignItems: 'center',
  },
  posterAppCtaText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#166534',
    textAlign: 'center',
  },
  posterAppCtaTextHindi: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#15803d',
    textAlign: 'center',
    marginTop: 1,
  },
  posterVoucherCardBox: {
    backgroundColor: '#fffdf0',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  posterVoucherTopHeader: {
    backgroundColor: '#fef3c7',
    paddingVertical: 3.5,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  posterVoucherTitle: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#b45309',
    letterSpacing: 0.4,
  },
  posterVoucherBodyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    gap: 8,
  },
  posterVoucherMainText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  posterVoucherBenefitHighlight: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
  },
  posterVoucherSubtext: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  posterVoucherCodeBadgeBox: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 95,
  },
  posterVoucherCodeLabel: {
    fontSize: 7.5,
    fontFamily: FONT.extraBold,
    color: '#dcfce7',
    letterSpacing: 0.4,
  },
  posterVoucherCodeText: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.8,
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

