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
import { formatInr } from '@/src/utils/formatInr';
import { FONT, RADIUS } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface VoucherItemDetail {
  name: string;
  qty?: number;
  unit?: string;
  rate?: number;
  amount: number;
}

export interface UniversalVoucherData {
  voucherType: 'PAYMENT_IN' | 'PAYMENT_OUT' | 'EXPENSE' | 'SALE' | 'PARTY_STATEMENT';
  title?: string;
  voucherNo?: string;
  date: string;
  time?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerVillage?: string;
  partyName: string;
  partyPhone?: string;
  partyRole?: string;
  kingId?: string;
  amount: number;
  paymentMode?: string;
  categoryOrWorkType?: string;
  description?: string;
  previousBalance?: number;
  newBalance?: number;
  items?: VoucherItemDetail[];
}

interface UniversalVoucherModalProps {
  visible: boolean;
  data: UniversalVoucherData | null;
  onClose: () => void;
}

export function UniversalVoucherSlipModal({ visible, data, onClose }: UniversalVoucherModalProps) {
  const shotRef = useRef<any>(null);
  const { user } = useAuth();
  const { data: settings } = useAppSettings();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!visible || !data) return null;

  const appName = settings?.appName || 'FarmsKing';
  const tagline = settings?.tagline || 'Smart Farming, Better Future';
  const farmerName = data.farmerName || user?.name || 'Farmer';
  const farmerPhone = data.farmerPhone || user?.mobile || '';
  const farmerVillage = data.farmerVillage || user?.village || '';

  // Determine theme colors based on voucher type
  const isReceipt = data.voucherType === 'PAYMENT_IN';
  const isPaymentOut = data.voucherType === 'PAYMENT_OUT';
  const isExpense = data.voucherType === 'EXPENSE';
  const isSale = data.voucherType === 'SALE';

  const themeColor = isReceipt
    ? '#16a34a'
    : isPaymentOut
    ? '#dc2626'
    : isExpense
    ? '#e11d48'
    : isSale
    ? '#059669'
    : '#0284c7';

  const defaultTitle = isReceipt
    ? '📑 PAYMENT RECEIPT (ਵਸੂਲੀ ਰਸੀਦ)'
    : isPaymentOut
    ? '💸 PAYMENT VOUCHER (ਭੁਗਤਾਨ ਰਸੀਦ)'
    : isExpense
    ? '🔴 EXPENSE STATEMENT SLIP (ਖਰਚਾ ਰਸੀਦ)'
    : isSale
    ? '🌾 SALE INVOICE / CROP BILL'
    : '📜 ACCOUNT STATEMENT SLIP';

  const titleText = data.title || defaultTitle;
  const voucherNoText = data.voucherNo || `FK-${Math.floor(100000 + Math.random() * 900000)}`;

  // Download / Share image as JPG
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

      const cleanFileName = `FarmsKing_${data.voucherType}_${voucherNoText}.jpg`;

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
      Alert.alert('Capture Failed', 'Could not generate JPG slip. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    tap();
    setIsProcessing(true);
    try {
      const itemsHtml = (data.items && data.items.length > 0)
        ? data.items
            .map(
              (item, idx) => `
          <tr>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: bold;">${item.name}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center;">${item.qty ? `${item.qty} ${item.unit || ''}` : '-'}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right;">${item.rate ? `₹${item.rate}` : '-'}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: bold; color: ${themeColor};">₹${item.amount.toLocaleString('en-IN')}</td>
          </tr>`
            )
            .join('')
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${titleText}</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #0f172a; }
              .card { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${themeColor}; padding-bottom: 10px; margin-bottom: 12px; }
              .brand { font-size: 20px; font-weight: 800; color: #15803d; }
              .tagline { font-size: 10px; color: #64748b; }
              .title-banner { background: ${themeColor}; color: #ffffff; text-align: center; font-weight: 800; font-size: 12px; padding: 6px; border-radius: 20px; margin: 12px 0; letter-spacing: 0.5px; }
              .grid { display: flex; gap: 10px; margin-bottom: 12px; }
              .box { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 11px; }
              .box-title { font-weight: 800; color: #475569; font-size: 9.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #cbd5e1; }
              .table th { background: #334155; color: #fff; font-size: 9px; padding: 6px; text-align: left; }
              .amount-box { background: #f8fafc; border: 1.5px solid ${themeColor}; border-radius: 8px; padding: 10px; margin-bottom: 12px; }
              .amount-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
              .amount-main { font-size: 16px; font-weight: 800; color: ${themeColor}; }
              .footer { text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div>
                  <div class="brand">👑 ${appName}</div>
                  <div class="tagline">${tagline}</div>
                </div>
                <div style="text-align: right; font-size: 11px;">
                  <strong>${voucherNoText}</strong><br/>
                  <span style="color:#64748b;">${data.date}</span>
                </div>
              </div>

              <div class="title-banner">${titleText}</div>

              <div class="grid">
                <div class="box">
                  <div class="box-title">👨‍🌾 ISSUER (FARMER)</div>
                  <strong>${farmerName}</strong><br/>
                  ${farmerPhone ? `Mobile: ${farmerPhone}<br/>` : ''}
                  ${farmerVillage ? `Location: ${farmerVillage}` : ''}
                </div>
                <div class="box">
                  <div class="box-title">🤝 PARTY / RECIPIENT</div>
                  <strong>${data.partyName}</strong><br/>
                  ${data.partyPhone ? `Mobile: ${data.partyPhone}<br/>` : ''}
                  Mode: ${data.paymentMode || 'CASH'}<br/>
                  ${data.categoryOrWorkType ? `Type: ${data.categoryOrWorkType}` : ''}
                </div>
              </div>

              ${itemsHtml ? `
              <table class="table">
                <thead>
                  <tr><th>#</th><th>ITEM</th><th style="text-align:center;">QTY</th><th style="text-align:right;">RATE</th><th style="text-align:right;">AMOUNT</th></tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>` : ''}

              <div class="amount-box">
                <div class="amount-row">
                  <span>Voucher Amount:</span>
                  <span class="amount-main">₹${data.amount.toLocaleString('en-IN')}</span>
                </div>
                ${data.description ? `<div style="font-size:11px; color:#475569; margin-top:4px;">Memo: ${data.description}</div>` : ''}
                ${typeof data.previousBalance === 'number' ? `
                <div class="amount-row" style="margin-top:6px; font-size:11px; border-top:1px dashed #cbd5e1; padding-top:4px;">
                  <span>Previous Balance:</span>
                  <span>₹${Math.abs(data.previousBalance).toLocaleString('en-IN')} ${data.previousBalance >= 0 ? '(ਲੇਣੀ / Rec)' : '(ਦੇਣੀ / Pay)'}</span>
                </div>` : ''}
                ${typeof data.newBalance === 'number' ? `
                <div class="amount-row" style="font-size:12px; font-weight:bold; color:${data.newBalance >= 0 ? '#16a34a' : '#dc2626'};">
                  <span>Net Balance:</span>
                  <span>₹${Math.abs(data.newBalance).toLocaleString('en-IN')} ${data.newBalance >= 0 ? '(ਲੇਣੀ / Rec)' : '(ਦੇਣੀ / Pay)'}</span>
                </div>` : ''}
              </div>

              <div class="footer">
                Computer Generated Official Slip · ${appName} Platform<br/>
                Verified & Recorded Entry
              </div>
            </div>
          </body>
        </html>`;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const file = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: `Share ${voucherNoText}.pdf` });
      }
    } catch (err) {
      console.error('PDF export error:', err);
      Alert.alert('Export Failed', 'Could not export PDF voucher.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.containerCard}>
          {/* Header Action Row */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>📄 Official Voucher & Statement Slip</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, alignItems: 'center' }}>
            {/* VIEW SHOT CAPTURE CARD */}
            <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 1.0 }} style={styles.slipCard}>
              <View style={[styles.topAccentBar, { backgroundColor: themeColor }]} />

              {/* Brand & Voucher Meta Header */}
              <View style={styles.slipHeaderUnified}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.slipVoucherNo}>{voucherNoText}</Text>
                  <Text style={styles.slipDateText}>{data.date}</Text>
                </View>

                <View style={{ flex: 1.6, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <BrandLogo size={26} useHdQuality />
                    <Text style={styles.brandTitleText}>{appName}</Text>
                  </View>
                  <Text style={styles.brandTaglineText}>{tagline}</Text>
                </View>

                <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                  <View style={[styles.statusBadgePill, { borderColor: themeColor }]}>
                    <Text style={[styles.statusBadgeText, { color: themeColor }]}>OFFICIAL</Text>
                  </View>
                </View>
              </View>

              {/* Title Banner */}
              <View style={[styles.titleBanner, { backgroundColor: themeColor }]}>
                <Text style={styles.titleBannerText}>{titleText}</Text>
              </View>

              {/* Issuer & Party Info Side by Side */}
              <View style={styles.partyGridRow}>
                <View style={styles.partyBox}>
                  <View style={[styles.partyHeader, { backgroundColor: '#15803d' }]}>
                    <Text style={styles.partyHeaderText}>👨‍🌾 ISSUER (FARMER)</Text>
                  </View>
                  <View style={styles.partyBody}>
                    <Text style={styles.partyNameBold}>{farmerName}</Text>
                    {farmerPhone ? <Text style={styles.partySubText}>📱 {farmerPhone}</Text> : null}
                    {farmerVillage ? <Text style={styles.partySubText}>📍 {farmerVillage}</Text> : null}
                  </View>
                </View>

                <View style={styles.partyBox}>
                  <View style={[styles.partyHeader, { backgroundColor: themeColor }]}>
                    <Text style={styles.partyHeaderText}>🤝 PARTY / RECIPIENT</Text>
                  </View>
                  <View style={styles.partyBody}>
                    <Text style={styles.partyNameBold}>{data.partyName}</Text>
                    {data.kingId ? <Text style={[styles.partySubText, { color: '#15803d', fontFamily: FONT.bold }]}>👑 King ID: {data.kingId}</Text> : null}
                    {data.partyPhone ? <Text style={styles.partySubText}>📱 {data.partyPhone}</Text> : null}
                    <Text style={styles.partySubText}>💳 Mode: {data.paymentMode || 'CASH'}</Text>
                    {data.categoryOrWorkType ? <Text style={styles.partySubText}>📌 Type: {data.categoryOrWorkType}</Text> : null}
                  </View>
                </View>
              </View>

              {/* Optional Itemized Table */}
              {data.items && data.items.length > 0 && (
                <View style={styles.itemsTable}>
                  <View style={[styles.tableHeaderRow, { backgroundColor: '#334155' }]}>
                    <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>#</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>ITEM / PARTICULARS</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>QTY</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>RATE</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>AMOUNT</Text>
                  </View>
                  {data.items.map((item, idx) => (
                    <View key={idx} style={styles.tableBodyRow}>
                      <Text style={[styles.tableCell, { flex: 0.4 }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { flex: 2, fontFamily: FONT.bold }]}>{item.name}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.qty ? `${item.qty} ${item.unit || ''}` : '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{item.rate ? `₹${item.rate}` : '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontFamily: FONT.extraBold, color: themeColor }]}>
                        ₹{item.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Amount & Summary Box */}
              <View style={[styles.summaryBox, { borderColor: themeColor }]}>
                <View style={styles.summaryRowMain}>
                  <Text style={styles.summaryLabelMain}>Total Voucher Amount:</Text>
                  <Text style={[styles.summaryValueMain, { color: themeColor }]}>{formatInr(data.amount)}</Text>
                </View>

                {data.description ? (
                  <Text style={styles.memoText}>📝 Memo: {data.description}</Text>
                ) : null}

                {typeof data.previousBalance === 'number' && (
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Previous Balance:</Text>
                    <Text style={styles.balanceValue}>
                      {formatInr(Math.abs(data.previousBalance))} {data.previousBalance >= 0 ? '(ਲੇਣੀ)' : '(ਦੇਣੀ)'}
                    </Text>
                  </View>
                )}

                {typeof data.newBalance === 'number' && (
                  <View style={[styles.balanceRow, { borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 4, marginTop: 4 }]}>
                    <Text style={[styles.balanceLabel, { fontFamily: FONT.bold, color: '#0f172a' }]}>New Net Balance:</Text>
                    <Text style={[styles.balanceValue, { fontFamily: FONT.extraBold, color: data.newBalance >= 0 ? '#16a34a' : '#dc2626' }]}>
                      {formatInr(Math.abs(data.newBalance))} {data.newBalance >= 0 ? '(ਲੇਣੀ / Receivable)' : '(ਦੇਣੀ / Payable)'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.slipFooter}>
                <Text style={styles.slipFooterText}>Computer Generated Official Voucher · {appName} Platform</Text>
                <Text style={styles.slipFooterSub}>Verified Digital Record</Text>
              </View>
            </ViewShot>
          </ScrollView>

          {/* Bottom Actions Row: Download JPG, Share PDF, Done */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
              activeOpacity={0.85}
              onPress={handleDownloadJpg}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>🖼️ JPG Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0284c7' }]}
              activeOpacity={0.85}
              onPress={handleExportPdf}
              disabled={isProcessing}
            >
              <Ionicons name="document-text-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>📄 PDF Print</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  containerCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 6,
  },
  modalTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },

  /* SLIP CARD */
  slipCard: {
    width: 340,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  slipHeaderUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingTop: 4,
    paddingBottom: 8,
    marginBottom: 8,
  },
  slipVoucherNo: { fontSize: 11, fontFamily: FONT.extraBold, color: '#0f172a' },
  slipDateText: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' },
  brandTitleText: { fontSize: 14, fontFamily: FONT.extraBold, color: '#15803d', letterSpacing: -0.2 },
  brandTaglineText: { fontSize: 8, fontFamily: FONT.medium, color: '#64748b' },
  statusBadgePill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: { fontSize: 8, fontFamily: FONT.bold, letterSpacing: 0.4 },

  titleBanner: {
    alignSelf: 'center',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  titleBannerText: { fontSize: 10.5, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.3 },

  partyGridRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  partyBox: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden', backgroundColor: '#ffffff' },
  partyHeader: { paddingVertical: 3, paddingHorizontal: 6 },
  partyHeaderText: { fontSize: 8, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.3 },
  partyBody: { padding: 6, gap: 1 },
  partyNameBold: { fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' },
  partySubText: { fontSize: 9.5, fontFamily: FONT.medium, color: '#475569' },

  itemsTable: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6 },
  tableHeaderCell: { fontSize: 8, fontFamily: FONT.bold, color: '#ffffff', letterSpacing: 0.2 },
  tableBodyRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  tableCell: { fontSize: 9.5, fontFamily: FONT.medium, color: '#334155' },

  summaryBox: { borderWidth: 1.5, borderRadius: 8, backgroundColor: '#f8fafc', padding: 8, marginBottom: 8 },
  summaryRowMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabelMain: { fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' },
  summaryValueMain: { fontSize: 15, fontFamily: FONT.extraBold },
  memoText: { fontSize: 9.5, fontFamily: FONT.medium, color: '#475569', marginTop: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  balanceLabel: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' },
  balanceValue: { fontSize: 10, fontFamily: FONT.bold, color: '#0f172a' },

  slipFooter: { alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 6, marginTop: 4 },
  slipFooterText: { fontSize: 8.5, fontFamily: FONT.bold, color: '#64748b' },
  slipFooterSub: { fontSize: 7.5, fontFamily: FONT.medium, color: '#94a3b8' },

  /* ACTION BUTTONS */
  actionsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  actionBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  closeBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569' },
});
