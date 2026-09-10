import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { formatInr } from '@/src/utils/formatInr';
import { formatDateDDMMYYYY } from '@/src/utils/formatDate';
import { FONT, RADIUS } from '@/constants/theme';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useAuth } from '@/src/store/auth-context';
import { resolveMediaUrl } from '@/src/api/client';
import { BrandLogo } from '@/src/components/BrandLogo';

const DEFAULT_LOGO = require('@/assets/images/farmsking_logo.png');

function getAssetUri(source: any): string | undefined {
  if (!source) return undefined;
  if (typeof source === 'string') return source;
  if (typeof source === 'number') {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri;
  }
  if (typeof source === 'object' && source.uri) {
    return source.uri;
  }
  return undefined;
}

/** Converts any remote network logo image URL into a base64 Data URI so that view-shot and HTML canvas capture on both Web and Mobile devices include the logo 100% reliably in the exported JPG file without missing graphics or cross-origin drops. */
function useCaptureSafeImageUri(uri: string | undefined): string | undefined {
  const [dataUri, setDataUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!uri) {
      setDataUri(undefined);
      return;
    }
    if (uri.startsWith('data:') || uri.startsWith('file:')) {
      setDataUri(uri);
      return;
    }

    let cancelled = false;
    fetch(uri)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled && typeof reader.result === 'string') {
            setDataUri(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        if (!cancelled) setDataUri(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return dataUri;
}

const BUNDLED_BILL_LOGO_HD = require('@/assets/images/farmsking_logo_hd.png');
const BUNDLED_BILL_LOGO_ICON = require('@/assets/images/farmsking_logo_icon.png');

/** Super Admin's uploaded logo, falling back to the bundled FarmsKing HD logo when none is set. */
export function BillLogo({ size = 32 }: { size?: number }) {
  return <BrandLogo size={size} useHdQuality />;
}

/** Compact inline side-by-side Brand Logo (32x32) + App Name + Tagline */
function BillBrand() {
  const { data: settings } = useAppSettings();
  return (
    <View style={billStyles.billBrandInlineRow}>
      <BillLogo size={32} />
      <View style={billStyles.billBrandTextGroup}>
        <Text style={billStyles.billBrandTitle}>{settings?.appName || 'FarmsKing'}</Text>
        <Text style={billStyles.billBrandTagline}>{settings?.tagline || 'Smart Farming, Better Future'}</Text>
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
  farmerUpiId?: string;
  partyId?: string;
  partyName: string;
  partyMobile?: string;
  partyAddress?: string;
  isCash: boolean;
  amountReceivedMode?: 'CASH' | 'UPI';
  items: SaleCartItem[];
  totalItems: number;
  totalAmount: number;
  amountReceived: number;
  thisSaleBalance: number;
  previousBalance: number;
  netReceivable: number;
  date: string;
  time: string;
  discountAmount?: number;
  deliveryCharge?: number;
  notes?: string;
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
  const { user } = useAuth();
  const { data: settings } = useAppSettings();
  const prevBal = Number(inv.previousBalance) || 0;
  const totalAmt = Number(inv.totalAmount) || 0;
  const rcvd = Number(inv.amountReceived) || 0;
  const discountVal = Number(inv.discountAmount) || 0;
  const deliveryVal = Number(inv.deliveryCharge) || 0;
  const rawSubtotal = (inv.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const grossBal = prevBal + totalAmt;
  const netBal = inv.netReceivable !== undefined && !isNaN(Number(inv.netReceivable))
    ? Number(inv.netReceivable)
    : grossBal - rcvd;

  const activeUpiId = inv.farmerUpiId || user?.upiId || settings?.upiId || 'surindersinghmakhu-5@oksbi';
  const payableAmt = netBal > 0 ? netBal : totalAmt;
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(inv.farmerName || 'FarmsKing')}&am=${payableAmt}&cu=INR`;
  const qrCodeUri = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=1&ecc=H&data=${encodeURIComponent(upiPayUrl)}`;
  const captureSafeQrUri = useCaptureSafeImageUri(qrCodeUri);
  const resolvedQrUri = Platform.OS === 'web' ? captureSafeQrUri : qrCodeUri;
  const totalQtyText = useMemo(() => {
    const qtyByUnit: Record<string, number> = {};
    inv.items.forEach((item) => {
      const u = item.unit || 'Units';
      qtyByUnit[u] = (qtyByUnit[u] || 0) + Number(item.qty || 0);
    });
    return Object.entries(qtyByUnit)
      .map(([unit, qty]) => `${qty} ${unit}`)
      .join(', ');
  }, [inv.items]);

  return (
    <View style={billStyles.billCard} collapsable={false}>
      {/* Top Emerald Metallic Line Accent */}
      <View style={billStyles.cardTopAccent} />

      {/* Unified Single Header Row: Bill No (Left) | Centered Logo + Tagline | Date (Right) */}
      <View style={billStyles.billHeaderRowUnified}>
        <View style={billStyles.headerMetaLeft}>
          <View style={billStyles.metaBadgePill}>
            <Text style={billStyles.billMetaLabel}>BILL NO.</Text>
            <Text style={billStyles.billMetaValue}>{inv.billNo}</Text>
          </View>
        </View>

        <View style={billStyles.headerCenterBrand}>
          <BillBrand />
        </View>

        <View style={billStyles.headerMetaRight}>
          <View style={[billStyles.metaBadgePill, { alignItems: 'flex-end' }]}>
            <Text style={billStyles.billMetaLabel}>DATE</Text>
            <Text style={billStyles.billMetaValue}>{formatDateDDMMYYYY(inv.date || new Date())}</Text>
          </View>
        </View>
      </View>

      {/* Official Title Banner */}
      <View style={billStyles.billTitleBanner}>
        <Text style={billStyles.billTitleBannerText}>🌾 OFFICIAL CROP SALE RECEIPT / BILL 🌾</Text>
      </View>

      {/* Farmer & Buyer Information Cards */}
      <View style={billStyles.billPartyRow}>
        <View style={[billStyles.billPartyBox, { borderColor: '#16a34a' }]}>
          <View style={[billStyles.billPartyHeader, { backgroundColor: '#16a34a' }]}>
            <Text style={billStyles.billPartyHeaderText}>FROM (FARMER / SELLER)</Text>
          </View>
          <View style={billStyles.billPartyBody}>
            <Text style={billStyles.billPartyLine}>
              Name: <Text style={billStyles.billPartyLineBold}>{inv.farmerName}</Text>
            </Text>
            {user?.mobile ? (
              <Text style={billStyles.billPartyLine}>
                Mobile: <Text style={billStyles.billPartyLineBold}>{user.mobile}</Text>
              </Text>
            ) : null}
            {user?.billPrintingAddress ? (
              <Text style={billStyles.billPartyLine}>
                Address: <Text style={billStyles.billPartyLineBold}>{user.billPrintingAddress}</Text>
              </Text>
            ) : user?.village || user?.district ? (
              <Text style={billStyles.billPartyLine}>
                Loc: <Text style={billStyles.billPartyLineBold}>{[user?.village, user?.district].filter(Boolean).join(', ')}</Text>
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[billStyles.billPartyBox, { borderColor: '#1e40af' }]}>
          <View style={[billStyles.billPartyHeader, { backgroundColor: '#1e40af' }]}>
            <Text style={billStyles.billPartyHeaderText}>TO (BUYER)</Text>
          </View>
          <View style={billStyles.billPartyBody}>
            {inv.partyName ? (
              <Text style={billStyles.billPartyLine}>
                Name: <Text style={billStyles.billPartyLineBold}>{inv.partyName}</Text>
              </Text>
            ) : null}
            <Text style={billStyles.billPartyLine}>
              Address: <Text style={billStyles.billPartyLineBold}>{inv.partyAddress || '-'}</Text>
            </Text>
            {inv.partyMobile ? (
              <Text style={billStyles.billPartyLine}>
                Mobile: <Text style={billStyles.billPartyLineBold}>{inv.partyMobile}</Text>
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Itemized Sale Table */}
      <View style={billStyles.billTable}>
        <View style={[billStyles.billTableRow, billStyles.billTableHeaderRow]}>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 0.4 }]}>SR</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1.8 }]}>CROP / PRODUCT</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1, textAlign: 'right' }]}>QTY</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1, textAlign: 'right' }]}>RATE (₹)</Text>
          <Text style={[billStyles.billTableCell, billStyles.billTableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>AMOUNT (₹)</Text>
        </View>
        {inv.items.map((item, idx) => (
          <View key={item.id || idx} style={[billStyles.billTableRow, idx % 2 === 1 && { backgroundColor: '#f8fafc' }]}>
            <Text style={[billStyles.billTableCell, { flex: 0.4 }]}>{idx + 1}</Text>
            <Text style={[billStyles.billTableCell, { flex: 1.8, fontFamily: FONT.bold }]}>{item.cropName}</Text>
            <Text style={[billStyles.billTableCell, { flex: 1, textAlign: 'right' }]}>
              {item.qty} {item.unit}
            </Text>
            <Text style={[billStyles.billTableCell, { flex: 1, textAlign: 'right' }]}>₹{item.rate}</Text>
            <Text style={[billStyles.billTableCell, { flex: 1.3, textAlign: 'right', fontFamily: FONT.bold }]}>{formatInr(item.amount)}</Text>
          </View>
        ))}

        <View style={[billStyles.billTableRow, billStyles.billTotalRow]}>
          <Text style={[billStyles.billTableCell, billStyles.billTotalLabel, { flex: 2.2 }]}>
            {inv.totalItems} ITEM(S)
          </Text>
          <Text style={[billStyles.billTableCell, billStyles.billTotalLabel, { flex: 1, textAlign: 'right', color: '#0f172a', fontSize: 10.5 }]}>
            {totalQtyText}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={[billStyles.billTableCell, billStyles.billTotalLabel, { flex: 1.3, textAlign: 'right', color: '#15803d', fontSize: 12 }]}>
            {formatInr(rawSubtotal)}
          </Text>
        </View>
      </View>

      {/* Discount, Delivery & Net Amount Calculation Card */}
      {(discountVal > 0 || deliveryVal > 0 || (inv.notes && inv.notes.trim())) ? (
        <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 }}>
          {(discountVal > 0 || deliveryVal > 0) ? (
            <View style={{ marginBottom: inv.notes && inv.notes.trim() ? 8 : 0 }}>
              {/* Upper Row: Headings */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 5, marginBottom: 6 }}>
                <Text style={{ flex: 1.2, fontSize: 9.5, color: '#475569', fontFamily: FONT.bold }}>Sale Amount</Text>
                {discountVal > 0 && (
                  <Text style={{ flex: 1, fontSize: 9.5, color: '#dc2626', fontFamily: FONT.bold, textAlign: 'center' }}>(-) Discount</Text>
                )}
                {deliveryVal > 0 && (
                  <Text style={{ flex: 1, fontSize: 9.5, color: '#2563eb', fontFamily: FONT.bold, textAlign: 'center' }}>(+) Delivery</Text>
                )}
                <Text style={{ flex: 1.3, fontSize: 9.5, color: '#15803d', fontFamily: FONT.extraBold, textAlign: 'right' }}>Net Sale Amount</Text>
              </View>

              {/* Lower Row: Values in single row! */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ flex: 1.2, fontSize: 11, color: '#0f172a', fontFamily: FONT.bold }}>{formatInr(rawSubtotal)}</Text>
                {discountVal > 0 && (
                  <Text style={{ flex: 1, fontSize: 11, color: '#dc2626', fontFamily: FONT.bold, textAlign: 'center' }}>-₹{discountVal.toLocaleString('en-IN')}</Text>
                )}
                {deliveryVal > 0 && (
                  <Text style={{ flex: 1, fontSize: 11, color: '#2563eb', fontFamily: FONT.bold, textAlign: 'center' }}>+₹{deliveryVal.toLocaleString('en-IN')}</Text>
                )}
                <Text style={{ flex: 1.3, fontSize: 12.5, color: '#15803d', fontFamily: FONT.extraBold, textAlign: 'right' }}>{formatInr(totalAmt)}</Text>
              </View>
            </View>
          ) : null}

          {/* Remarks / Notes (if present) */}
          {inv.notes && inv.notes.trim() ? (
            <View style={{ borderTopWidth: (discountVal > 0 || deliveryVal > 0) ? 1 : 0, borderTopColor: '#cbd5e1', paddingTop: (discountVal > 0 || deliveryVal > 0) ? 6 : 0, marginTop: (discountVal > 0 || deliveryVal > 0) ? 6 : 0 }}>
              <Text style={{ fontSize: 9.5, color: '#475569', fontFamily: FONT.bold }}>
                📝 REMARKS / NOTES: <Text style={{ fontFamily: FONT.medium, color: '#0f172a' }}>{inv.notes.trim()}</Text>
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Cash Sale Payment Summary Box OR Credit Party Account Statement */}
      <View style={billStyles.billBottomRow}>
        {inv.isCash ? (
          <View style={[billStyles.billSummaryBox, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
            <View style={[billStyles.billSummaryHeaderRow, { borderBottomColor: '#bbf7d0' }]}>
              <Text style={[billStyles.billSummaryTitle, { color: '#15803d' }]}>💵 CASH PAYMENT SUMMARY</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>Total Bill Amount</Text>
              <Text style={billStyles.billSummaryValue}>{formatInr(totalAmt)}</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>
                Cash Received {inv.amountReceivedMode ? `(${inv.amountReceivedMode})` : '(Cash)'}
              </Text>
              <Text style={[billStyles.billSummaryValue, { color: '#16a34a', fontFamily: FONT.bold }]}>{formatInr(totalAmt)}</Text>
            </View>
            <View style={[billStyles.billSummaryLine, billStyles.billSummaryNetLine, { borderTopColor: '#bbf7d0' }]}>
              <Text style={[billStyles.billSummaryNetLabel, { color: '#15803d' }]}>REMAINING BALANCE</Text>
              <Text style={[billStyles.billSummaryNetValue, { color: '#16a34a' }]}>₹0</Text>
            </View>
          </View>
        ) : (
          <View style={billStyles.billSummaryBox}>
            <View style={billStyles.billSummaryHeaderRow}>
              <Text style={billStyles.billSummaryTitle}>📊 PARTY ACCOUNT STATEMENT</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>Previous Balance</Text>
              <Text style={billStyles.billSummaryValue}>{formatInr(prevBal)}</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>+ Current Bill Total</Text>
              <Text style={billStyles.billSummaryValue}>{formatInr(totalAmt)}</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>Gross Account Balance</Text>
              <Text style={billStyles.billSummaryValue}>{formatInr(grossBal)}</Text>
            </View>
            <View style={billStyles.billSummaryLine}>
              <Text style={billStyles.billSummaryLabel}>
                (-) Payment Received {rcvd > 0 ? `(${inv.amountReceivedMode || 'Cash'})` : ''}
              </Text>
              <Text style={[billStyles.billSummaryValue, { color: '#dc2626' }]}>{formatInr(rcvd)}</Text>
            </View>
            <View style={[billStyles.billSummaryLine, billStyles.billSummaryNetLine]}>
              <Text style={billStyles.billSummaryNetLabel}>NET RECEIVABLE BALANCE</Text>
              <Text style={billStyles.billSummaryNetValue}>{formatInr(netBal)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Side-by-Side Bottom Cards: UPI QR (Left, Credit only) | Amount in Words */}
      <View style={billStyles.billBottomTwoCardsRow}>
        {/* Left: UPI QR Code Box - Hidden for Cash Sales */}
        {!inv.isCash ? (
          <View style={billStyles.billUpiQrBoxLeft}>
            <View style={{ flex: 1, justifyContent: 'center', gap: 1 }}>
              <Text style={billStyles.billUpiTitle}>📲 Pay via UPI</Text>
              <Text style={billStyles.billUpiAmtText}>Amt: <Text style={{ fontFamily: FONT.extraBold, color: '#0f172a', fontSize: 10.5 }}>{formatInr(payableAmt)}</Text></Text>
            </View>
            <View style={billStyles.billQrWrapper}>
              {resolvedQrUri ? (
                <Image source={{ uri: resolvedQrUri }} style={billStyles.billQrImage} resizeMode="contain" />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Right: Amount in Words Box (Full width on Cash Sale) */}
        <View style={[billStyles.billWordsBoxRight, inv.isCash && { flex: 1 }]}>
          <Text style={billStyles.billWordsLabel}>AMOUNT IN WORDS</Text>
          <Text style={billStyles.billWordsValue} numberOfLines={2}>{amountToWords(inv.isCash ? totalAmt : (netBal !== 0 ? netBal : totalAmt))}</Text>
        </View>
      </View>

      {/* Professional Footer & Stamp Signatory */}
      <View style={billStyles.billFooterRow}>
        <View style={{ flex: 1.5, gap: 2 }}>
          <Text style={billStyles.billFooterThanks}>🌾 Thank you for your business! 🌾</Text>
          <Text style={billStyles.billFooterTerms}>
            Computer generated verified bill · FarmsKing Platform.
          </Text>
        </View>
        <View style={billStyles.signatoryBox}>
          <View style={billStyles.signatoryLine} />
          <Text style={billStyles.signatoryText}>Authorised Signatory / Farmer</Text>
        </View>
      </View>
    </View>
  );
}

export function PaymentReceiptPreview({ inv }: { inv: PaymentReceiptData }) {
  const { user } = useAuth();

  return (
    <View style={billStyles.billCard} collapsable={false}>
      {/* Unified Single Header Row: Receipt No (Left) | Centered Logo + Tagline | Date (Right) */}
      <View style={billStyles.billHeaderRowUnified}>
        <View style={billStyles.headerMetaLeft}>
          <Text style={billStyles.billMetaLabel}>RECEIPT NO.</Text>
          <Text style={billStyles.billMetaValue}>{inv.receiptNo}</Text>
        </View>

        <View style={billStyles.headerCenterBrand}>
          <BillBrand />
        </View>

        <View style={billStyles.headerMetaRight}>
          <Text style={billStyles.billMetaLabel}>DATE</Text>
          <Text style={billStyles.billMetaValue}>{formatDateDDMMYYYY(inv.date || new Date())}</Text>
        </View>
      </View>

      <View style={[billStyles.billTitleBanner, { backgroundColor: inv.isReceived ? '#16a34a' : '#dc2626' }]}>
        <Text style={billStyles.billTitleBannerText}>{inv.isReceived ? '💰 PAYMENT RECEIPT' : '💸 PAYMENT RECEIPT'}</Text>
      </View>

      <View style={billStyles.billSummaryBox}>
        <View style={billStyles.billSummaryLine}>
          <Text style={billStyles.billSummaryLabel}>Farmer Name</Text>
          <Text style={billStyles.billSummaryValue}>
            {inv.receiverName} {user?.mobile ? `(📱 ${user.mobile})` : ''}
          </Text>
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

      <View style={billStyles.billFooterRow}>
        <Text style={billStyles.billFooterThanks}>🌾 Thank you 🌾</Text>
        <Text style={billStyles.billFooterTerms}>System-generated receipt from the FarmsKing app.</Text>
      </View>
    </View>
  );
}

/** Shared imperative capture + share/download-as-JPG for whatever is currently mounted inside the returned ref.
 * Auto-saves a temporary cached copy on device/web system temporary files when previewed.
 */
export function useShareBillAsJpg() {
  const billShotRef = useRef<any>(null);
  const [isSharingBill, setIsSharingBill] = useState(false);
  const [tempCachedUri, setTempCachedUri] = useState<string | null>(null);

  /** Auto-saves the rendered bill view to system/mobile temporary files */
  const autoSaveTempPreview = async () => {
    if (!billShotRef.current) return;
    try {
      const uri = await captureRef(billShotRef, {
        format: 'jpg',
        quality: 1.0,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });
      setTempCachedUri(uri);
    } catch (err) {
      // Silent cache fill
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      autoSaveTempPreview();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const shareInvoiceAsJpg = async (fileName?: string) => {
    if (!billShotRef.current) return;
    tap();
    setIsSharingBill(true);
    try {
      // High Definition 1.0 Quality Capture
      const uri = await captureRef(billShotRef, {
        format: 'jpg',
        quality: 1.0,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });
      setTempCachedUri(uri);

      const rawName = fileName || 'bill';
      const cleanFileName = rawName.toLowerCase().endsWith('.jpg') ? rawName : `${rawName}.jpg`;

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      Alert.alert('Bill Not Shared', 'Could not generate the HD bill image. Please try again.');
    } finally {
      setIsSharingBill(false);
    }
  };

  const shareInvoiceAsPdf = async (inv?: SavedSaleInvoice, fileName?: string) => {
    if (!inv) return;
    tap();
    setIsSharingBill(true);
    try {
      await exportBillAsPdf(inv, fileName);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      Alert.alert('PDF Export Failed', 'Could not generate PDF bill. Please try again.');
    } finally {
      setIsSharingBill(false);
    }
  };

  return { billShotRef, isSharingBill, tempCachedUri, autoSaveTempPreview, shareInvoiceAsJpg, shareInvoiceAsPdf };
}

async function fetchAsBase64DataUri(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Generates clean PDF bill file and opens Print/Download/Share dialog */
export async function exportBillAsPdf(inv: SavedSaleInvoice, fileName?: string, appSettings?: any, user?: any) {
  const discountVal = Number(inv.discountAmount) || 0;
  const deliveryVal = Number(inv.deliveryCharge) || 0;
  const rawSubtotal = (inv.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const appName = appSettings?.appName || 'FarmsKing';
  const tagline = appSettings?.tagline || 'Agricultural & Farm Management Platform';
  const logoUrl = appSettings?.logoUrl || user?.photoUrl;
  const resolvedLogoUrl = logoUrl ? resolveMediaUrl(logoUrl) : null;
  const logoBase64 = await fetchAsBase64DataUri(resolvedLogoUrl);

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" style="width:42px; height:42px; border-radius:8px; object-fit:contain; vertical-align:middle;" />`
    : `<div style="width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg, #15803d, #16a34a); display:inline-flex; align-items:center; justify-content:center; color:#ffffff; font-size:22px; font-weight:bold; vertical-align:middle;">👑</div>`;

  const itemsRows = inv.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700;">${item.cropName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${item.qty} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right;">₹${item.rate}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: 700; color: #15803d;">₹${item.amount.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Sale Bill ${inv.billNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bill-card {
            width: 100%;
            box-sizing: border-box;
            border: 1.5px solid #cbd5e1;
            border-radius: 12px;
            padding: 24px;
            background: #ffffff;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #15803d;
            margin: 0;
            letter-spacing: -0.3px;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 1px 0 0 0;
          }
          .banner {
            background: #15803d;
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
            text-align: center;
            padding: 6px 20px;
            border-radius: 20px;
            width: fit-content;
            margin: 12px auto 16px auto;
            letter-spacing: 0.5px;
          }
          .party-grid {
            display: flex;
            gap: 14px;
            margin-bottom: 16px;
          }
          .party-box {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
          }
          .party-header {
            background: #16a34a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 6px 10px;
            letter-spacing: 0.4px;
          }
          .party-header.buyer {
            background: #0284c7;
          }
          .party-body {
            padding: 10px;
            font-size: 12px;
            line-height: 18px;
            color: #334155;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }
          .items-table th {
            background: #334155;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 9px;
            text-align: left;
          }
          .summary-box {
            border: 1.5px solid #ddd6fe;
            background: #fcfbfe;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
          }
          .summary-line {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            padding: 3px 0;
            color: #334155;
          }
          .summary-net {
            border-top: 1.5px solid #c4b5fd;
            background: #f3e8ff;
            padding: 8px 10px;
            margin-top: 6px;
            border-radius: 4px;
            font-weight: 800;
            color: #5b21b6;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #64748b;
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="bill-card">
          <div class="header-row">
            <div>
              <div style="font-size: 9px; color: #94a3b8; font-weight: 700; letter-spacing: 0.3px;">BILL NO.</div>
              <div style="font-size: 13px; color: #0f172a; font-weight: 800;">${inv.billNo}</div>
            </div>
            <div class="brand-wrap">
              ${logoHtml}
              <div>
                <div class="brand-title">${appName}</div>
                <div class="brand-sub">${tagline}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; color: #94a3b8; font-weight: 700; letter-spacing: 0.3px;">DATE</div>
              <div style="font-size: 12px; color: #0f172a; font-weight: 700;">${inv.date}</div>
            </div>
          </div>

          <div class="banner">📑 SALE INVOICE / CROP BILL</div>

          <div class="party-grid">
            <div class="party-box">
              <div class="party-header">👨‍🌾 SELLER (FARMER)</div>
              <div class="party-body">
                <strong>${inv.farmerName}</strong><br/>
                ${user?.mobile ? `Mobile: ${user.mobile}<br/>` : ''}
                ${user?.village ? `Address: ${user.village}, ${user.district || ''}<br/>` : ''}
              </div>
            </div>
            <div class="party-box">
              <div class="party-header buyer">TO (BUYER)</div>
              <div class="party-body">
                <strong>${inv.partyName || 'Cash Sale'}</strong><br/>
                Address: ${inv.partyAddress || '-'}<br/>
                ${inv.partyMobile ? `Mobile: ${inv.partyMobile}<br/>` : ''}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 28px;">#</th>
                <th>CROP / ITEM</th>
                <th style="text-align: center;">QTY</th>
                <th style="text-align: right;">RATE</th>
                <th style="text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr style="background: #f0fdf4; font-weight: 800;">
                <td colspan="4" style="text-align: right; padding: 8px; font-size: 12px;">ITEMS TOTAL:</td>
                <td style="text-align: right; padding: 8px; color: #15803d; font-size: 13px;">₹${rawSubtotal.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          ${(discountVal > 0 || deliveryVal > 0 || (inv.notes && inv.notes.trim())) ? `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 14px;">
              ${(discountVal > 0 || deliveryVal > 0) ? `
                <div style="margin-bottom: ${inv.notes && inv.notes.trim() ? '8px' : '0'};">
                  <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                      <tr style="border-bottom: 1px solid #cbd5e1; color: #475569; font-weight: 700;">
                        <th style="text-align: left; padding-bottom: 4px; font-size: 10px;">Sale Amount</th>
                        ${discountVal > 0 ? `<th style="text-align: center; padding-bottom: 4px; color: #dc2626; font-size: 10px;">(-) Discount</th>` : ''}
                        ${deliveryVal > 0 ? `<th style="text-align: center; padding-bottom: 4px; color: #2563eb; font-size: 10px;">(+) Delivery</th>` : ''}
                        <th style="text-align: right; padding-bottom: 4px; color: #15803d; font-weight: 800; font-size: 10px;">Net Sale Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="text-align: left; padding-top: 6px; font-weight: 700; color: #0f172a; font-size: 12px;">₹${rawSubtotal.toLocaleString('en-IN')}</td>
                        ${discountVal > 0 ? `<td style="text-align: center; padding-top: 6px; font-weight: 700; color: #dc2626; font-size: 12px;">-₹${discountVal.toLocaleString('en-IN')}</td>` : ''}
                        ${deliveryVal > 0 ? `<td style="text-align: center; padding-top: 6px; font-weight: 700; color: #2563eb; font-size: 12px;">+₹${deliveryVal.toLocaleString('en-IN')}</td>` : ''}
                        <td style="text-align: right; padding-top: 6px; font-weight: 800; color: #15803d; font-size: 13px;">₹${inv.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ` : ''}
              ${inv.notes && inv.notes.trim() ? `
                <div style="border-top: ${discountVal > 0 || deliveryVal > 0 ? '1px solid #e2e8f0' : 'none'}; padding-top: 6px; margin-top: 6px; font-size: 11px; color: #334155;">
                  <strong>📝 Remarks / Notes:</strong> ${inv.notes.trim()}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="summary-box">
            <div class="summary-line">
              <span>Sale Total Amount</span>
              <strong>₹${inv.totalAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div class="summary-line">
              <span>Amount Received / Paid ${inv.amountReceivedMode ? `(${inv.amountReceivedMode})` : ''}</span>
              <strong style="color: #16a34a;">₹${inv.amountReceived.toLocaleString('en-IN')}</strong>
            </div>
            <div class="summary-line">
              <span>Previous Balance</span>
              <strong>₹${inv.previousBalance.toLocaleString('en-IN')}</strong>
            </div>
            <div class="summary-line summary-net">
              <span>Net Receivable Balance</span>
              <span>₹${inv.netReceivable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style="margin-bottom: 14px; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; color: #334155;">
            <strong>AMOUNT IN WORDS:</strong> ${amountToWords(inv.isCash ? inv.totalAmount : (inv.netReceivable ? Number(inv.netReceivable) : inv.totalAmount))}
          </div>

          <div class="footer">
            🌾 Thank you for your business! 🌾<br/>
            Computer Generated Bill · FarmsKing Application
          </div>
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
  } else {
    const file = await Print.printToFileAsync({ html });
    const rawName = fileName || `Bill-${inv.billNo}`;
    const cleanFileName = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Download ${cleanFileName}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

export const billStyles = StyleSheet.create({
  billCard: {
    width: 350,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#16a34a',
  },
  billHeaderRowUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingTop: 4,
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerMetaLeft: {
    flex: 1.1,
    alignItems: 'flex-start',
  },
  headerCenterBrand: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMetaRight: {
    flex: 1.1,
    alignItems: 'flex-end',
  },
  metaBadgePill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  billBrandInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  billBrandTextGroup: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  billLogoCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  billLogoImage: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'transparent' },
  billBrandTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#15803d', letterSpacing: -0.2 },
  billBrandTagline: { fontSize: 8.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 0 },
  billMetaLabel: { fontSize: 8, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 0.3 },
  billMetaValue: { fontSize: 10.5, fontFamily: FONT.bold, color: '#0f172a' },
  billTitleBanner: {
    alignSelf: 'center',
    backgroundColor: '#15803d',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 10,
  },
  billTitleBannerText: { fontSize: 11, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.5 },
  billPartyRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  billPartyBox: { flex: 1, borderWidth: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff' },
  billPartyHeader: { paddingVertical: 4, paddingHorizontal: 8 },
  billPartyHeaderText: { fontSize: 8.5, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.4 },
  billPartyBody: { padding: 7, gap: 2 },
  billPartyLine: { fontSize: 10, fontFamily: FONT.medium, color: '#475569' },
  billPartyLineBold: { fontFamily: FONT.bold, color: '#0f172a' },
  billTable: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  billTableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  billTableHeaderRow: { backgroundColor: '#334155', borderBottomColor: '#1e293b' },
  billTableCell: { fontSize: 10, fontFamily: FONT.medium, color: '#334155' },
  billTableHeaderCell: { fontFamily: FONT.bold, color: '#ffffff', fontSize: 8.5, letterSpacing: 0.3 },
  billTotalRow: { backgroundColor: '#f0fdf4', borderBottomWidth: 0, borderTopWidth: 1.5, borderTopColor: '#bbf7d0' },
  billTotalLabel: { fontFamily: FONT.extraBold, color: '#0f172a', fontSize: 10.5 },
  billBottomRow: { gap: 8, marginBottom: 10 },
  billPayModeBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 8 },
  billPayModeLabel: { fontSize: 8.5, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 0.4 },
  billPayModeValue: { fontSize: 12, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 2 },
  billSummaryBox: { borderWidth: 1.5, borderColor: '#ddd6fe', backgroundColor: '#fcfbfe', borderRadius: 8, padding: 8 },
  billSummaryHeaderRow: { marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f3e8ff', paddingBottom: 3 },
  billSummaryTitle: { fontSize: 9.5, fontFamily: FONT.extraBold, color: '#6d28d9', letterSpacing: 0.3 },
  billSummaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  billSummaryLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#475569' },
  billSummaryValue: { fontSize: 10, fontFamily: FONT.bold, color: '#0f172a' },
  billSummaryNetLine: { borderTopWidth: 1.5, borderTopColor: '#c4b5fd', marginTop: 4, paddingTop: 4, backgroundColor: '#f3e8ff', paddingHorizontal: 6, borderRadius: 4 },
  billSummaryNetLabel: { fontSize: 10.5, fontFamily: FONT.extraBold, color: '#5b21b6' },
  billSummaryNetValue: { fontSize: 12, fontFamily: FONT.extraBold, color: '#5b21b6' },
  billBottomTwoCardsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  billUpiQrBoxLeft: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
    gap: 4,
  },
  billWordsBoxRight: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  billUpiTitle: { fontSize: 10, fontFamily: FONT.extraBold, color: '#15803d', letterSpacing: -0.1 },
  billUpiAmtText: { fontSize: 8.5, fontFamily: FONT.medium, color: '#334155' },
  billWordsLabel: { fontSize: 7.5, fontFamily: FONT.bold, color: '#64748b', letterSpacing: 0.3, marginBottom: 1 },
  billWordsValue: { fontSize: 9, fontFamily: FONT.bold, color: '#0f172a', lineHeight: 11.5 },
  billQrWrapper: {
    backgroundColor: '#ffffff',
    padding: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  billQrImage: { width: 38, height: 38 },
  billFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 2 },
  billFooterThanks: { fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' },
  billFooterTerms: { fontSize: 8, fontFamily: FONT.medium, color: '#94a3b8', lineHeight: 11 },
  signatoryBox: { alignItems: 'center', width: 110 },
  signatoryLine: { width: '100%', height: 1, backgroundColor: '#64748b', marginBottom: 3 },
  signatoryText: { fontSize: 7.5, fontFamily: FONT.bold, color: '#475569', textAlign: 'center' },
});
