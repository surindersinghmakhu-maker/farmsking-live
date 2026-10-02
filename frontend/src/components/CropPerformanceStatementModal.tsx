import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { formatInr } from '@/src/utils/formatInr';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface CropPerformanceData {
  refNo?: string;
  cropName: string;
  variety?: string;
  area?: string;
  fieldLocation?: string;
  sowingDate?: string;
  harvestDate?: string;
  status?: string;
  totalExpenses: number;
  totalSales: number;
  netProfit: number;
  totalSpraysCount?: number;
  totalYieldQuantity?: string;
  notes?: string;
}

interface CropPerformanceStatementModalProps {
  visible: boolean;
  data: CropPerformanceData | null;
  onClose: () => void;
}

export function CropPerformanceStatementModal({ visible, data, onClose }: CropPerformanceStatementModalProps) {
  const shotRef = useRef<any>(null);
  const { user } = useAuth();
  const { colors } = useExecutiveTheme();
  const { data: settings } = useAppSettings();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!visible || !data) return null;

  const farmerRefCode = data.refNo || (user?.refCode || user?.referralCode ? `EXP-${user.refCode || user.referralCode}` : (user?.id ? `EXP-${String(user.id).padStart(6, '0')}` : 'EXP-100001'));
  const refNumber = farmerRefCode;
  const appName = settings?.appName || 'FarmsKing';
  const farmerName = user?.farmName || user?.name || 'Farmer Ji';
  const farmerPhone = user?.farmMobile || user?.mobile || '';
  const farmerAddress = [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || 'Punjab';
  const isProfit = data.netProfit >= 0;

  // Download JPG
  const handleDownloadJpg = async () => {
    if (!shotRef.current) return;
    tap();
    setIsProcessing(true);
    try {
      const uri = await captureRef(shotRef, {
        format: 'jpg',
        quality: 1.0,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });

      const cleanFileName = `Crop_Performance_Statement_${refNumber}.jpg`;

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: `Download / Share ${cleanFileName}`,
          UTI: 'public.jpeg',
        });
      }
    } catch (err) {
      console.error('Failed to capture JPG:', err);
      Alert.alert('Capture Failed', 'Could not generate JPG statement. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download PDF
  const handleExportPdf = async () => {
    tap();
    setIsProcessing(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Crop Performance Statement - ${refNumber}</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #0f172a; }
              .card { max-width: 550px; margin: 0 auto; background: #ffffff; border: 2px solid ${colors.primary}; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${colors.primary}; padding-bottom: 12px; margin-bottom: 14px; }
              .brand { font-size: 22px; font-weight: 800; color: ${colors.primary}; }
              .ref-box { text-align: right; font-size: 11px; }
              .title-banner { background: ${colors.headerBg}; color: #ffffff; text-align: center; font-weight: 800; font-size: 13px; padding: 8px; border-radius: 6px; margin: 12px 0; letter-spacing: 0.5px; }
              .info-grid { display: flex; gap: 12px; margin-bottom: 14px; }
              .info-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 11px; background: #f8fafc; }
              .info-box-title { font-weight: 800; color: #475569; font-size: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
              .stat-row { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 12px; font-weight: 600; }
              .stat-expense { background: #ffe4e6; color: #9f1239; }
              .stat-sales { background: #dcfce7; color: #166534; }
              .stat-net { background: ${isProfit ? '#dcfce7' : '#ffe4e6'}; color: ${isProfit ? '#15803d' : '#be123c'}; font-size: 15px; font-weight: 800; border: 1.5px solid ${isProfit ? '#16a34a' : '#e11d48'}; }
              .footer { text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div>
                  <div class="brand">👑 ${appName}</div>
                  <div style="font-size: 10px; color: #64748b;">Official Crop Performance Audit Statement</div>
                </div>
                <div class="ref-box">
                  <strong>EXP Ref. No: ${refNumber}</strong><br/>
                  <span style="color:#64748b;">Date: ${new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div class="title-banner">🌾 CROP PERFORMANCE STATEMENT AUDIT</div>

              <div class="info-grid">
                <div class="info-box">
                  <div class="info-box-title">🧑‍🌾 FARMER DETAILS</div>
                  <strong>${farmerName}</strong><br/>
                  Phone: +91 ${farmerPhone}<br/>
                  Location: ${farmerAddress}
                </div>

                <div class="info-box">
                  <div class="info-box-title">🌱 CROP DETAILS</div>
                  <strong>${data.cropName}</strong> ${data.variety ? `(${data.variety})` : ''}<br/>
                  Area: ${data.area || '1 Acre'}<br/>
                  Sowing Date: ${data.sowingDate || 'N/A'}<br/>
                  Harvest Date: ${data.harvestDate || 'Ongoing'}
                </div>
              </div>

              <div style="margin-bottom: 14px;">
                <div class="stat-row stat-expense">
                  <span>Total Crop Expenses (ਖਰਚਾ):</span>
                  <span>₹${data.totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div class="stat-row stat-sales">
                  <span>Total Harvest Sales (ਵਿਕਰੀ):</span>
                  <span>₹${data.totalSales.toLocaleString('en-IN')}</span>
                </div>
                <div class="stat-row stat-net">
                  <span>Net Profit / Margin (ਸ਼ੁੱਧ ਮੁਨਾਫਾ):</span>
                  <span>₹${data.netProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>

              ${data.notes ? `<div style="font-size: 11px; font-style: italic; color: #475569; background: #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 12px;">Notes: ${data.notes}</div>` : ''}

              <div class="footer">
                Verified Official Statement generated via ${appName} Smart Farming Platform.<br/>
                Computer Generated Document — No Signature Required.
              </div>
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 300);
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      Alert.alert('PDF Failed', 'Could not generate PDF statement. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          {/* Header Action Bar */}
          <View style={[styles.topBar, { borderBottomColor: colors.cardBorder }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.topBarTitle, { color: colors.text }]}>Crop Performance Statement</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.bg }]}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Printable / Capturable Card Slip */}
          <ScrollView contentContainerStyle={{ padding: 14 }}>
            <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 1.0 }} style={[styles.slipCard, { backgroundColor: '#ffffff', borderColor: colors.primary }]}>
              {/* Slip Top Banner */}
              <LinearGradient colors={colors.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.slipHeaderBanner}>
                <View style={styles.brandRow}>
                  <BrandLogo size={28} iconColor="#ffffff" />
                  <View>
                    <Text style={styles.appNameText}>{appName}</Text>
                    <Text style={styles.appTaglineText}>Smart Farming Audit</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.refNoBadge}>EXP Ref. No: {refNumber}</Text>
                  <Text style={styles.dateText}>{new Date().toLocaleDateString('en-IN')}</Text>
                </View>
              </LinearGradient>

              {/* Title Strip */}
              <View style={[styles.titleStrip, { backgroundColor: colors.primaryLight, borderColor: colors.borderColor }]}>
                <Text style={[styles.titleStripText, { color: colors.primary }]}>🌾 CROP PERFORMANCE STATEMENT</Text>
              </View>

              {/* Farmer & Crop Meta Grid */}
              <View style={styles.metaGrid}>
                <View style={styles.metaBox}>
                  <Text style={styles.metaBoxTitle}>🧑‍🌾 FARMER DETAILS</Text>
                  <Text style={styles.metaMainText}>{farmerName}</Text>
                  <Text style={styles.metaSubText}>📱 +91 {farmerPhone}</Text>
                  <Text style={styles.metaSubText}>📍 {farmerAddress}</Text>
                </View>

                <View style={styles.metaBox}>
                  <Text style={styles.metaBoxTitle}>🌱 CROP DETAILS</Text>
                  <Text style={styles.metaMainText}>{data.cropName}</Text>
                  <Text style={styles.metaSubText}>Variety: {data.variety || 'Standard'}</Text>
                  <Text style={styles.metaSubText}>Area: {data.area || '1 Acre'}</Text>
                </View>
              </View>

              {/* Performance Breakdown Table */}
              <View style={styles.statsContainer}>
                <View style={[styles.statRow, { backgroundColor: '#ffe4e6' }]}>
                  <Text style={[styles.statLabel, { color: '#9f1239' }]}>Total Crop Expenses (ਖਰਚਾ):</Text>
                  <Text style={[styles.statValue, { color: '#9f1239' }]}>- {formatInr(data.totalExpenses)}</Text>
                </View>

                <View style={[styles.statRow, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.statLabel, { color: '#166534' }]}>Total Harvest Sales (ਵਿਕਰੀ):</Text>
                  <Text style={[styles.statValue, { color: '#166534' }]}>+ {formatInr(data.totalSales)}</Text>
                </View>

                <View style={[styles.statRow, styles.statRowProfit, { backgroundColor: isProfit ? '#dcfce7' : '#ffe4e6', borderColor: isProfit ? '#16a34a' : '#e11d48' }]}>
                  <Text style={[styles.statLabelMain, { color: isProfit ? '#15803d' : '#be123c' }]}>Net Profit / Margin (ਸ਼ੁੱਧ ਮੁਨਾਫਾ):</Text>
                  <Text style={[styles.statValueMain, { color: isProfit ? '#15803d' : '#be123c' }]}>{formatInr(data.netProfit)}</Text>
                </View>
              </View>

              {/* Official Seal / Verification Footer */}
              <View style={styles.slipFooter}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.slipFooterText}>
                  Verified Official Statement generated via FarmsKing Platform (Ref. {refNumber})
                </Text>
              </View>
            </ViewShot>
          </ScrollView>

          {/* Action Buttons: Download PDF & Download JPG */}
          <View style={[styles.actionsRow, { borderTopColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.btn, styles.pdfBtn]}
              disabled={isProcessing}
              onPress={handleExportPdf}
            >
              {isProcessing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={18} color="#ffffff" />
                  <Text style={styles.btnText}>Download PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              disabled={isProcessing}
              onPress={handleDownloadJpg}
            >
              {isProcessing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#ffffff" />
                  <Text style={styles.btnText}>Download Image / JPG</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...premiumShadow('#000000', 'lg'),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slipCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  slipHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appNameText: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  appTaglineText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  refNoBadge: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  dateText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  titleStrip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  titleStripText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 2,
  },
  metaBoxTitle: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#64748b',
    marginBottom: 2,
  },
  metaMainText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  metaSubText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  statsContainer: {
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  statRowProfit: {
    borderWidth: 1.5,
    paddingVertical: 10,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  statValue: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  statLabelMain: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  statValueMain: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  slipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4,
  },
  slipFooterText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  pdfBtn: {
    backgroundColor: '#0284c7',
  },
  btnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
