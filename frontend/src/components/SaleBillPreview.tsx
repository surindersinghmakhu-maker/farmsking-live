import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { formatInr } from '@/src/utils/formatInr';
import { FONT, RADIUS } from '@/constants/theme';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { resolveMediaUrl } from '@/src/api/client';

/** On web, the JPG-share capture (html2canvas-style) can't read pixels from a cross-origin <img>
 * unless it's inlined as a data: URI — a remote /uploads/... URL displays fine on-screen but is
 * silently dropped from the captured image. Native ViewShot captures the real view, no such issue. */
function useCaptureSafeImageUri(uri: string | undefined): string | undefined {
  const [dataUri, setDataUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!uri || Platform.OS !== 'web') {
      setDataUri(undefined);
      return;
    }
    let cancelled = false;
    fetch(uri)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      )
      .then((result) => {
        if (!cancelled) setDataUri(result);
      })
      .catch(() => {
        if (!cancelled) setDataUri(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return Platform.OS === 'web' ? dataUri : uri;
}

/** Super Admin's uploaded logo, falling back to the leaf icon badge when none is set. */
export function BillLogo() {
  const { data: settings } = useAppSettings();
  const logoUri = resolveMediaUrl(settings?.logoUrl);
  const captureSafeUri = useCaptureSafeImageUri(logoUri);
  const resolvedUri = Platform.OS === 'web' ? captureSafeUri : logoUri;

  if (resolvedUri) {
    return <Image source={{ uri: resolvedUri }} style={billStyles.billLogoImage} />;
  }
  return (
    <View style={billStyles.billLogoCircle}>
      <Ionicons name="leaf" size={22} color="#ffffff" />
    </View>
  );
}

/** Logo + brand name + Super Admin's configured tagline (falls back to the default line when none is set). */
function BillBrand() {
  const { data: settings } = useAppSettings();
  return (
    <View style={billStyles.billBrandRow}>
      <BillLogo />
      <View>
        <Text style={billStyles.billBrand}>{settings?.appName || 'FarmsKing'}</Text>
        <Text style={billStyles.billBrandSub}>{settings?.tagline || 'Smart Farming, Better Future'}</Text>
      </View>
    </View>
  );
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface SaleCartItem {
  id: string;
  cropId: string;
  cropName: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface SavedSaleInvoice {
  billNo: string;
  farmerName: string;
  partyId?: string;
  partyName: string;
  partyMobile?: string;
  isCash: boolean;
  items: SaleCartItem[];
  totalItems: number;
  totalAmount: number;
  amountReceived: number;
  thisSaleBalance: number;
  previousBalance: number;
  netReceivable: number;
  date: string;
  time: string;
}

export interface PaymentReceiptData {
  receiptNo: string;
  receiverName: string;
  partyName: string;
  isReceived: boolean;
  previousBalance: number;
  paymentAmount: number;
  netBalance: number;
  date: string;
  time: string;
}

const WORD_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const WORD_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
  if (n < 20) return WORD_ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${WORD_TENS[t]}${o ? ' ' + WORD_ONES[o] : ''}`;
}

function threeDigitWords(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${h ? WORD_ONES[h] + ' Hundred' : ''}${h && rest ? ' ' : ''}${rest ? twoDigitWords(rest) : ''}`;
}

export function amountToWords(amount: number): string {
  const n = Math.round(amount);
  if (n <= 0) return 'Zero Rupees Only';
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const hundred = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitWords(hundred));
  return `Rupees ${parts.join(' ')} Only`;
}

export function BillPreview({ inv }: { inv: SavedSaleInvoice }) {
  return (
    <View style={billStyles.billCard} collapsable={false}>
      <View style={billStyles.billHeaderRow}>
        <BillBrand />
        <View style={billStyles.billMetaBox}>
          <Text style={billStyles.billMetaLabel}>BILL NO.</Text>
          <Text style={billStyles.billMetaValue}>{inv.billNo}</Text>
          <Text style={[billStyles.billMetaLabel, { marginTop: 4 }]}>DATE / TIME</Text>
          <Text style={billStyles.billMetaValue}>{inv.date} · {inv.time}</Text>
        </View>
      </View>

      <View style={billStyles.billTitleBanner}>
        <Text style={billStyles.billTitleBannerText}>🌾 FARMER CROP SALE BILL 🌾</Text>
      </View>

      <View style={billStyles.billPartyRow}>
        <View style={[billStyles.billPartyBox, { borderColor: '#16a34a' }]}>
          <View style={[billStyles.billPartyHeader, { backgroundColor: '#16a34a' }]}>
            <Text style={billStyles.billPartyHeaderText}>FROM (FARMER)</Text>
          </View>
          <View style={billStyles.billPartyBody}>
            <Text style={billStyles.billPartyLine}>
              Name: <Text style={billStyles.billPartyLineBold}>{inv.farmerName}</Text>
            </Text>
          </View>
        </View>
        <View style={[billStyles.billPartyBox, { borderColor: '#1d4ed8' }]}>
          <View style={[billStyles.billPartyHeader, { backgroundColor: '#1d4ed8' }]}>
            <Text style={billStyles.billPartyHeaderText}>TO (BUYER)</Text>
          </View>
          <View style={billStyles.billPartyBody}>
            <Text style={billStyles.billPartyLine}>
              Type: <Text style={billStyles.billPartyLineBold}>{inv.isCash ? 'CASH' : 'PARTY'}</Text>
            </Text>
            {!inv.isCash ? (
              <Text style={billStyles.billPartyLine}>
                Name: <Text style={billStyles.billPartyLineBold}>{inv.partyName}</Text>
              </Text>
            ) : null}
            {inv.partyMobile ? (
              <Text style={billStyles.billPartyLine}>
                Mobile: <Text style={billStyles.billPartyLineBold}>{inv.partyMobile}</Text>
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={billStyles.billTable}>
        <View style={[billStyles.billTableRow, billStyles.billTableHeaderRow]}>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 0.4 }]}>Sr</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1.8 }]}>Crop</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1, textAlign: 'right' }]}>Qty</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1, textAlign: 'right' }]}>Rate</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>Amount</Text>
        </View>
        {inv.items.map((item, idx) => (
          <View key={item.id} style={billStyles.billTableRow}>
            <Text style={[billStyles.billTableCell, { flex: 0.4 }]}>{idx + 1}</Text>
            <Text style={[billStyles.billTableCell, { flex: 1.8 }]}>{item.cropName}</Text>
            <Text style={[billStyles.billTableCell, { flex: 1, textAlign: 'right' }]}>
              {item.qty} {item.unit}
            </Text>
            <Text style={[billStyles.billTableCell, { flex: 1, textAlign: 'right' }]}>₹{item.rate}</Text>
            <Text style={[billStyles.billTableCell, { flex: 1.3, textAlign: 'right' }]}>{formatInr(item.amount)}</Text>
          </View>
        ))}
        <View style={[billStyles.billTableRow, billStyles.billTotalRow]}>
          <Text style={[billStyles.billTableCell, billStyles.billTotalLabel, { flex: 4.2 }]}>TOTAL AMOUNT</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTotalLabel, { flex: 1.3, textAlign: 'right' }]}>{formatInr(inv.totalAmount)}</Text>
        </View>
      </View>

      <View style={billStyles.billBottomRow}>
        <View style={billStyles.billPayModeBox}>
          <Text style={billStyles.billPayModeLabel}>PAYMENT MODE</Text>
          <Text style={billStyles.billPayModeValue}>{inv.isCash ? 'CASH' : 'PARTY (CREDIT)'}</Text>
        </View>

        {!inv.isCash && (
          <View style={billStyles.billSummaryBox}>
            <Text style={billStyles.billSummaryTitle}>ACCOUNT SUMMARY (PARTY)</Text>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>Previous Balance</Text>
              <Text style={billStyles.billSummaryValue}>{formatInr(inv.previousBalance)}</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>+ Current Bill</Text>
              <Text style={billStyles.billSummaryValue}>{formatInr(inv.totalAmount)}</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>Gross Balance</Text>
              <Text style={billStyles.billSummaryValue}>{formatInr(inv.previousBalance + inv.totalAmount)}</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>(-) Payment Received</Text>
              <Text style={[billStyles.billSummaryValue, { color: '#dc2626' }]}>{formatInr(inv.amountReceived)}</Text>
            </View>
            <View style={[billStyles.billSummaryLine, billStyles.billSummaryNetLine]}>
              <Text style={billStyles.billSummaryNetLabel}>NET BALANCE</Text>
              <Text style={billStyles.billSummaryNetValue}>{formatInr(inv.netReceivable)}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={billStyles.billWordsBox}>
        <Text style={billStyles.billWordsLabel}>Amount in Words</Text>
        <Text style={billStyles.billWordsValue}>{amountToWords(inv.totalAmount)}</Text>
      </View>

      <View style={billStyles.billFooter}>
        <Text style={billStyles.billFooterThanks}>🌾 Thank you for your business 🌾</Text>
        <Text style={billStyles.billFooterTerms}>
          Goods once sold will not be taken back · Payment due as per agreed terms · System-generated bill from the FarmsKing app.
        </Text>
      </View>
    </View>
  );
}

export function PaymentReceiptPreview({ inv }: { inv: PaymentReceiptData }) {
  return (
    <View style={billStyles.billCard} collapsable={false}>
      <View style={billStyles.billHeaderRow}>
        <BillBrand />
        <View style={billStyles.billMetaBox}>
          <Text style={billStyles.billMetaLabel}>RECEIPT NO.</Text>
          <Text style={billStyles.billMetaValue}>{inv.receiptNo}</Text>
          <Text style={[billStyles.billMetaLabel, { marginTop: 4 }]}>DATE / TIME</Text>
          <Text style={billStyles.billMetaValue}>{inv.date} · {inv.time}</Text>
        </View>
      </View>

      <View style={[billStyles.billTitleBanner, { backgroundColor: inv.isReceived ? '#16a34a' : '#dc2626' }]}>
        <Text style={billStyles.billTitleBannerText}>{inv.isReceived ? '💰 PAYMENT RECEIPT' : '💸 PAYMENT RECEIPT'}</Text>
      </View>

      <View style={billStyles.billSummaryBox}>
        <View style={billStyles.billSummaryLine}>
          <Text style={billStyles.billSummaryLabel}>Receiver Name</Text>
          <Text style={billStyles.billSummaryValue}>{inv.receiverName}</Text>
        </View>
        <View style={billStyles.billSummaryLine}>
          <Text style={billStyles.billSummaryLabel}>Party Name</Text>
          <Text style={billStyles.billSummaryValue}>{inv.partyName}</Text>
        </View>
        <View style={billStyles.billSummaryLine}>
          <Text style={billStyles.billSummaryLabel}>Previous Balance</Text>
          <Text style={billStyles.billSummaryValue}>{formatInr(Math.abs(inv.previousBalance))}</Text>
        </View>
        <View style={billStyles.billSummaryLine}>
          <Text style={billStyles.billSummaryLabel}>{inv.isReceived ? 'Payment Received' : 'Payment Made'}</Text>
          <Text style={[billStyles.billSummaryValue, { color: inv.isReceived ? '#16a34a' : '#dc2626' }]}>
            {formatInr(inv.paymentAmount)}
          </Text>
        </View>
        <View style={[billStyles.billSummaryLine, billStyles.billSummaryNetLine]}>
          <Text style={billStyles.billSummaryNetLabel}>Net Balance</Text>
          <Text style={billStyles.billSummaryNetValue}>{formatInr(Math.abs(inv.netBalance))}</Text>
        </View>
      </View>

      <View style={billStyles.billFooter}>
        <Text style={billStyles.billFooterThanks}>🌾 Thank you 🌾</Text>
        <Text style={billStyles.billFooterTerms}>System-generated receipt from the FarmsKing app.</Text>
      </View>
    </View>
  );
}

/** Shared imperative capture + share/download-as-JPG for whatever is currently mounted inside the returned ref. */
export function useShareBillAsJpg() {
  const billShotRef = useRef<ViewShot>(null);
  const [isSharingBill, setIsSharingBill] = useState(false);

  const shareInvoiceAsJpg = async (fileName?: string) => {
    if (!billShotRef.current) return;
    tap();
    setIsSharingBill(true);
    try {
      const uri = await captureRef(billShotRef, { format: 'jpg', quality: 0.95 });
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `${fileName || 'bill'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Sale Bill' });
      }
    } catch {
      Alert.alert('Bill Not Shared', 'Could not generate the bill image. Please try again.');
    } finally {
      setIsSharingBill(false);
    }
  };

  return { billShotRef, isSharingBill, shareInvoiceAsJpg };
}

export const billStyles = StyleSheet.create({
  billCard: {
    width: 340,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  billHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#16a34a', paddingBottom: 10, marginBottom: 10 },
  billBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  billLogoCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  billLogoImage: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9' },
  billBrand: { fontSize: 16, fontFamily: FONT.extraBold, color: '#16a34a' },
  billBrandSub: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  billMetaBox: { alignItems: 'flex-end' },
  billMetaLabel: { fontSize: 8.5, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 0.4 },
  billMetaValue: { fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' },
  billTitleBanner: {
    alignSelf: 'center',
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 10,
  },
  billTitleBannerText: { fontSize: 11.5, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.4 },
  billPartyRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  billPartyBox: { flex: 1, borderWidth: 1, borderRadius: 6, overflow: 'hidden' },
  billPartyHeader: { paddingVertical: 4, paddingHorizontal: 8 },
  billPartyHeaderText: { fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.3 },
  billPartyBody: { padding: 8, gap: 2 },
  billPartyLine: { fontSize: 10.5, fontFamily: FONT.medium, color: '#475569' },
  billPartyLineBold: { fontFamily: FONT.bold, color: '#0f172a' },
  billTable: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  billTableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  billTableHeaderRow: { backgroundColor: '#f1f5f9', borderBottomColor: '#e2e8f0' },
  billTableCell: { fontSize: 10.5, fontFamily: FONT.medium, color: '#334155' },
  billTableHeaderCell: { fontFamily: FONT.bold, color: '#475569', fontSize: 9.5 },
  billTotalRow: { backgroundColor: '#f8fafc', borderBottomWidth: 0 },
  billTotalLabel: { fontFamily: FONT.extraBold, color: '#0f172a', fontSize: 11 },
  billBottomRow: { gap: 8, marginBottom: 10 },
  billPayModeBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 8 },
  billPayModeLabel: { fontSize: 8.5, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 0.4 },
  billPayModeValue: { fontSize: 12, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 2 },
  billSummaryBox: { borderWidth: 1, borderColor: '#ddd6fe', backgroundColor: '#faf5ff', borderRadius: 6, padding: 8 },
  billSummaryTitle: { fontSize: 9, fontFamily: FONT.extraBold, color: '#6d28d9', letterSpacing: 0.3, marginBottom: 4 },
  billSummaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  billSummaryLabel: { fontSize: 10.5, fontFamily: FONT.medium, color: '#475569' },
  billSummaryValue: { fontSize: 10.5, fontFamily: FONT.bold, color: '#0f172a' },
  billSummaryNetLine: { borderTopWidth: 1, borderTopColor: '#e9d5ff', marginTop: 3, paddingTop: 4 },
  billSummaryNetLabel: { fontSize: 11, fontFamily: FONT.extraBold, color: '#6d28d9' },
  billSummaryNetValue: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#6d28d9' },
  billWordsBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 8, marginBottom: 10 },
  billWordsLabel: { fontSize: 8.5, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 0.4, marginBottom: 2 },
  billWordsValue: { fontSize: 10.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  billFooter: { alignItems: 'center', gap: 3 },
  billFooterThanks: { fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' },
  billFooterTerms: { fontSize: 8.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', lineHeight: 12 },
});
