import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { formatInr } from '@/src/utils/formatInr';
import { cleanParticulars } from '@/src/utils/partyLedger';
import { FONT, RADIUS } from '@/constants/theme';

import {
  BillPreview,
  PaymentReceiptPreview,
  useShareBillAsJpg,
  type SavedSaleInvoice,
  type PaymentReceiptData,
} from '@/src/components/SaleBillPreview';
import { useFetchSaleBill } from '@/src/hooks/useSaleBills';
import { useFetchPaymentReceipt } from '@/src/hooks/usePaymentReceipts';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface RawStatementEntry {
  id: string;
  date: string;
  type: string; // 'SALE_CREDIT' | 'SALE_PAYMENT' | 'EXPENSE_CREDIT' | 'EXPENSE_PAYMENT' | 'INCOME' | 'EXPENSE'
  reason: string;
  amount: number;
  billNo?: string;
  saleBillId?: string;
  paymentReceiptId?: string;
}

export interface ComputedStatementEntry extends RawStatementEntry {
  plusAmount: number;
  minusAmount: number;
  runningBalance: number;
}

interface UniversalStatementModalProps {
  visible: boolean;
  onClose: () => void;
  partyName: string;
  partyPhone?: string;
  partyRole?: string;
  kingId?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerVillage?: string;
  entries: RawStatementEntry[];
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgoIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

export function UniversalStatementModal({
  visible,
  onClose,
  partyName,
  partyPhone,
  partyRole = 'Party Account',
  kingId,
  farmerName: propFarmerName,
  farmerPhone: propFarmerPhone,
  farmerVillage: propFarmerVillage,
  entries = [],
}: UniversalStatementModalProps) {
  const shotRef = useRef<any>(null);
  const { user } = useAuth();
  const { data: settings } = useAppSettings();

  const appName = settings?.appName || 'FarmsKing';
  const tagline = settings?.tagline || 'Smart Farming, Better Future';
  const farmerName = propFarmerName || user?.name || 'Farmer';
  const farmerPhone = propFarmerPhone || user?.mobile || '';
  const farmerVillage = propFarmerVillage || user?.village || '';

  // Date Range Filters
  const [fromDate, setFromDate] = useState(() => thirtyDaysAgoIso());
  const [toDate, setToDate] = useState(() => todayIso());
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview Modal States
  const [previewInvoice, setPreviewInvoice] = useState<SavedSaleInvoice | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<PaymentReceiptData | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const fetchSaleBill = useFetchSaleBill();
  const fetchPaymentReceipt = useFetchPaymentReceipt();
  const { billShotRef: previewShotRef, isSharingBill, shareInvoiceAsJpg } = useShareBillAsJpg();

  const handleOpenPreviewForEntry = async (item: ComputedStatementEntry) => {
    tap();
    setIsFetchingPreview(true);
    try {
      const isSale = item.type === 'SALE_CREDIT' || item.type === 'CREDIT' || item.plusAmount > 0;
      if (isSale) {
        const refMatch = item.billNo && item.billNo !== '—' ? item.billNo : item.reason?.match(/FK-[A-Za-z0-9]+/i)?.[0];
        const targetBillId = item.saleBillId || refMatch;
        if (targetBillId) {
          try {
            const bill = await fetchSaleBill.mutateAsync(targetBillId);
            const created = new Date(bill.createdAt);
            setPreviewInvoice({
              billNo: bill.billNo,
              farmerName,
              partyId: bill.partyId || '',
              partyName: bill.partyName || partyName,
              isCash: bill.isCash,
              items: (bill.items || []).map((i: any) => ({
                id: i.id,
                cropId: i.cropId || '',
                cropName: i.cropName,
                unit: i.unit || '',
                qty: Number(i.qty),
                rate: Number(i.rate),
                amount: Number(i.amount),
              })),
              totalItems: bill.totalItems || bill.items?.length || 1,
              totalAmount: Number(bill.totalAmount),
              amountReceived: Number(bill.amountReceived || 0),
              thisSaleBalance: Number(bill.thisSaleBalance || bill.totalAmount),
              previousBalance: Number(bill.previousBalance || 0),
              netReceivable: Number(bill.netReceivable || bill.totalAmount),
              discountAmount: bill.discountAmount !== undefined ? Number(bill.discountAmount) : 0,
              deliveryCharge: bill.deliveryCharge !== undefined ? Number(bill.deliveryCharge) : 0,
              notes: bill.notes || undefined,
              date: created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              time: created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            });
            setPreviewReceipt(null);
            setPreviewModalVisible(true);
            return;
          } catch (e) {
            console.log('Online bill fetch failed, falling back to local reconstruction');
          }
        }

        // Local fallback invoice
        const now = new Date(item.date);
        setPreviewInvoice({
          billNo: item.billNo || `FK-${item.id.slice(0, 8).toUpperCase()}`,
          farmerName,
          partyId: '',
          partyName,
          isCash: false,
          items: [{ id: item.id, cropId: '', cropName: item.reason || 'Sale', unit: '', qty: 1, rate: Number(item.amount), amount: Number(item.amount) }],
          totalItems: 1,
          totalAmount: Number(item.amount),
          amountReceived: 0,
          thisSaleBalance: Number(item.amount),
          previousBalance: 0,
          netReceivable: Number(item.amount),
          date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });
        setPreviewReceipt(null);
        setPreviewModalVisible(true);
      } else {
        if (item.paymentReceiptId) {
          try {
            const receipt = await fetchPaymentReceipt.mutateAsync(item.paymentReceiptId);
            const created = new Date(receipt.createdAt);
            setPreviewReceipt({
              receiptNo: receipt.receiptNo,
              receiverName: farmerName,
              partyName: receipt.partyName || partyName,
              isReceived: receipt.isReceived,
              previousBalance: Number(receipt.previousBalance),
              paymentAmount: Number(receipt.paymentAmount),
              netBalance: Number(receipt.netBalance),
              date: created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              time: created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            });
            setPreviewInvoice(null);
            setPreviewModalVisible(true);
            return;
          } catch (e) {
            console.log('Online receipt fetch failed, falling back to local reconstruction');
          }
        }

        // Local fallback receipt
        const now = new Date(item.date);
        setPreviewReceipt({
          receiptNo: item.billNo || `RCT-${item.id.slice(0, 8).toUpperCase()}`,
          receiverName: farmerName,
          partyName,
          isReceived: true,
          previousBalance: 0,
          paymentAmount: Number(item.amount),
          netBalance: Number(item.runningBalance),
          date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });
        setPreviewInvoice(null);
        setPreviewModalVisible(true);
      }
    } finally {
      setIsFetchingPreview(false);
    }
  };

  // Compute Running Balances & Date Filtering (+ - =)
  const { computedEntries, totalPlus, totalMinus, finalNetBalance } = useMemo(() => {
    // 1. Sort entries chronologically (oldest to newest) to compute running balance
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let accumulated = 0;
    let sumPlus = 0;
    let sumMinus = 0;

    const allComputed: ComputedStatementEntry[] = sorted.map((e) => {
      const isPlus =
        e.type === 'SALE_CREDIT' ||
        e.type === 'SALE_PAYMENT' ||
        e.type === 'INCOME' ||
        e.type === 'RECEIPT_IN';

      const plusAmount = isPlus ? Number(e.amount) : 0;
      const minusAmount = !isPlus ? Number(e.amount) : 0;

      // Plus increases receivable, minus decreases it
      const change = plusAmount - minusAmount;
      accumulated += change;

      sumPlus += plusAmount;
      sumMinus += minusAmount;

      return {
        ...e,
        plusAmount,
        minusAmount,
        runningBalance: accumulated,
      };
    });

    // 2. Filter by Date Range
    const filtered = allComputed.filter((e) => {
      const entryDate = e.date.slice(0, 10);
      if (fromDate && entryDate < fromDate) return false;
      if (toDate && entryDate > toDate) return false;
      return true;
    });

    // Reverse for latest first display if desired, or keep chronological
    return {
      computedEntries: filtered,
      totalPlus: sumPlus,
      totalMinus: sumMinus,
      finalNetBalance: accumulated,
    };
  }, [entries, fromDate, toDate]);

  if (!visible) return null;

  const isShortList = computedEntries.length <= 8;

  // Download JPG for short lists
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

      const cleanFileName = `FarmsKing_Statement_${partyName.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.jpg`;

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
          dialogTitle: `Download Statement JPG`,
          UTI: 'public.jpeg',
        });
      }
    } catch (err) {
      console.error('Failed to capture JPG statement:', err);
      Alert.alert('Capture Failed', 'Could not generate JPG statement image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export Multi-page PDF for longer statements
  const handleExportPdf = async () => {
    tap();
    setIsProcessing(true);
    try {
      const rowsHtml = computedEntries
        .map(
          (item, idx) => `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px;">${item.date.slice(0, 10)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: bold; color: #0f172a;">${cleanParticulars(item.reason, item.plusAmount, item.minusAmount)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: right; color: #16a34a; font-weight: bold;">${item.plusAmount > 0 ? `+ ₹${item.plusAmount.toLocaleString('en-IN')}` : '-'}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: right; color: #dc2626; font-weight: bold;">${item.minusAmount > 0 ? `- ₹${item.minusAmount.toLocaleString('en-IN')}` : '-'}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: right; font-weight: 800; color: ${item.runningBalance >= 0 ? '#15803d' : '#b91c1c'};">= ₹${Math.abs(item.runningBalance).toLocaleString('en-IN')} ${item.runningBalance >= 0 ? '(Receivable)' : '(Payable)'}</td>
        </tr>`
        )
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>FARMSKING PARTY STATEMENT</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #ffffff; color: #0f172a; }
              .card { max-width: 750px; margin: 0 auto; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #16a34a; padding-bottom: 10px; margin-bottom: 12px; }
              .brand { font-size: 22px; font-weight: 800; color: #15803d; }
              .tagline { font-size: 10px; color: #64748b; }
              .title-banner { background: #15803d; color: #ffffff; text-align: center; font-weight: 800; font-size: 13px; padding: 6px; border-radius: 20px; margin: 10px 0; letter-spacing: 0.5px; }
              .grid { display: flex; gap: 10px; margin-bottom: 12px; }
              .box { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 11px; }
              .box-title { font-weight: 800; color: #475569; font-size: 9.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #cbd5e1; }
              .table th { background: #334155; color: #fff; font-size: 9.5px; padding: 7px; text-align: left; }
              .summary-box { background: #f8fafc; border: 1.5px solid #16a34a; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
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
                  <strong>STATEMENT OF ACCOUNT</strong><br/>
                  <span style="color:#64748b;">Period: ${fromDate} to ${toDate}</span>
                </div>
              </div>

              <div class="title-banner">📜 OFFICIAL PARTY LEDGER STATEMENT</div>

              <div class="grid">
                <div class="box">
                  <div class="box-title">👨‍🌾 ISSUER (FARMER)</div>
                  <strong>${farmerName}</strong><br/>
                  ${farmerPhone ? `Mobile: ${farmerPhone}<br/>` : ''}
                  ${farmerVillage ? `Location: ${farmerVillage}` : ''}
                </div>
                <div class="box">
                  <div class="box-title">🤝 PARTY / WORKER</div>
                  <strong>${partyName}</strong><br/>
                  ${kingId ? `<span style="color:#15803d; font-weight:bold;">👑 King ID: ${kingId}</span><br/>` : ''}
                  ${partyPhone ? `Mobile: ${partyPhone}<br/>` : ''}
                  Account Type: ${partyRole}
                </div>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>PARTICULARS / REASON</th>
                    <th style="text-align:right;">(+) CREDIT (₹)</th>
                    <th style="text-align:right;">(-) DEBIT (₹)</th>
                    <th style="text-align:right;">(=) NET BALANCE (₹)</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>

              <div class="summary-box">
                <span style="color:#16a34a;">Total Received (+): ₹${totalPlus.toLocaleString('en-IN')}</span>
                <span style="color:#dc2626;">Total Paid (-): ₹${totalMinus.toLocaleString('en-IN')}</span>
                <span style="color:#15803d;">Net Balance (=): ₹${Math.abs(finalNetBalance).toLocaleString('en-IN')} ${finalNetBalance >= 0 ? '(Receivable)' : '(Payable)'}</span>
              </div>

              <div class="footer">
                Computer Generated Official Ledger Statement · ${appName} Platform<br/>
                Verified Digital Account Record
              </div>
            </div>
          </body>
        </html>`;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const file = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${partyName}_Statement.pdf`,
        });
      }
    } catch (err) {
      console.error('PDF export error:', err);
      Alert.alert('Export Failed', 'Could not export PDF statement.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.containerCard}>
          {/* Top Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>📜 Party Account Statement</Text>
              <Text style={styles.modalSubTitle}>{partyName} · Farmer-wise Running Balance</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Date Filter Bar: From Date to To Date */}
          <View style={styles.dateFilterContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>From Date:</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={fromDate}
                onChangeText={setFromDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>To Date:</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={toDate}
                onChangeText={setToDate}
              />
            </View>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => {
                tap();
                setFromDate('');
                setToDate(todayIso());
              }}
            >
              <Text style={styles.presetBtnText}>All Time</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ paddingVertical: 8, alignItems: 'center' }}>
            {/* ViewShot Container for Image Capture */}
            <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 1.0 }} style={styles.slipCard}>
              <View style={styles.topAccentBar} />

              {/* FarmsKing Official Header */}
              <View style={styles.slipHeaderUnified}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.statementTitleText}>LEDGER STATEMENT</Text>
                  <Text style={styles.slipDateText}>{fromDate || 'Start'} to {toDate || 'Today'}</Text>
                </View>

                <View style={{ flex: 1.6, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <BrandLogo size={24} useHdQuality />
                    <Text style={styles.brandTitleText}>{appName}</Text>
                  </View>
                  <Text style={styles.brandTaglineText}>{tagline}</Text>
                </View>

                <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                  <View style={styles.statusBadgePill}>
                    <Text style={styles.statusBadgeText}>VERIFIED</Text>
                  </View>
                </View>
              </View>

              {/* Farmer & Party Banner Info */}
              <View style={styles.partyGridRow}>
                <View style={styles.partyBox}>
                  <View style={[styles.partyHeader, { backgroundColor: '#15803d' }]}>
                    <Text style={styles.partyHeaderText}>👨‍🌾 FARMER</Text>
                  </View>
                  <View style={styles.partyBody}>
                    <Text style={styles.partyNameBold}>{farmerName}</Text>
                    {farmerPhone ? <Text style={styles.partySubText}>📱 {farmerPhone}</Text> : null}
                    {farmerVillage ? <Text style={styles.partySubText}>📍 {farmerVillage}</Text> : null}
                  </View>
                </View>

                <View style={styles.partyBox}>
                  <View style={[styles.partyHeader, { backgroundColor: '#0284c7' }]}>
                    <Text style={styles.partyHeaderText}>🤝 PARTY / WORKER</Text>
                  </View>
                  <View style={styles.partyBody}>
                    <Text style={styles.partyNameBold}>{partyName}</Text>
                    {kingId ? <Text style={[styles.partySubText, { color: '#15803d', fontFamily: FONT.bold }]}>👑 King ID: {kingId}</Text> : null}
                    {partyPhone ? <Text style={styles.partySubText}>📱 {partyPhone}</Text> : null}
                    <Text style={styles.partySubText}>📌 Type: {partyRole}</Text>
                  </View>
                </View>
              </View>

              {/* Transactions Table (+ - =) */}
              <View style={styles.tableCard}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>DATE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>PARTICULARS</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right', color: '#86efac' }]}>(+) REC</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right', color: '#fca5a5' }]}>(-) PAY</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'right', color: '#fef08a' }]}>(=) BAL</Text>
                </View>

                {computedEntries.length === 0 ? (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8' }}>
                      No ledger entries found for selected date range.
                    </Text>
                  </View>
                ) : (
                  computedEntries.map((item, idx) => (
                    <View key={item.id || idx} style={styles.tableBodyRow}>
                      <Text style={[styles.tableCell, { flex: 0.8, fontSize: 8.5 }]}>{item.date.slice(5, 10)}</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleOpenPreviewForEntry(item)}
                        style={{ flex: 2, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}
                      >
                        <Text style={[styles.tableCell, { fontFamily: FONT.bold, color: '#0369a1' }]} numberOfLines={2}>
                          {cleanParticulars(item.reason, item.plusAmount, item.minusAmount)}
                        </Text>
                        {item.billNo ? (
                          <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Ionicons name="document-text-outline" size={9} color="#1d4ed8" />
                            <Text style={{ fontSize: 7.5, fontFamily: FONT.bold, color: '#1d4ed8' }}>{item.billNo}</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>

                      {/* (+) Credit Amount */}
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontFamily: FONT.bold, color: '#16a34a' }]}>
                        {item.plusAmount > 0 ? `+${item.plusAmount}` : '-'}
                      </Text>

                      {/* (-) Debit Amount */}
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontFamily: FONT.bold, color: '#dc2626' }]}>
                        {item.minusAmount > 0 ? `-${item.minusAmount}` : '-'}
                      </Text>

                      {/* (=) Daily Running Balance */}
                      <Text
                        style={[
                          styles.tableCell,
                          {
                            flex: 1.3,
                            textAlign: 'right',
                            fontFamily: FONT.extraBold,
                            color: item.runningBalance >= 0 ? '#15803d' : '#b91c1c',
                          },
                        ]}
                      >
                        ={formatInr(Math.abs(item.runningBalance))}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* Running Balance Summary Bar */}
              <View style={styles.summaryBar}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.summaryLabel}>Total (+) Received</Text>
                  <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{formatInr(totalPlus)}</Text>
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#cbd5e1' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.summaryLabel}>Total (-) Paid</Text>
                  <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{formatInr(totalMinus)}</Text>
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#cbd5e1' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.summaryLabel}>Net Balance (=)</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: finalNetBalance >= 0 ? '#15803d' : '#b91c1c' },
                    ]}
                  >
                    {formatInr(Math.abs(finalNetBalance))} {finalNetBalance >= 0 ? '(Receivable)' : '(Payable)'}
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.slipFooter}>
                <Text style={styles.slipFooterText}>Computer Generated Official Statement · {appName}</Text>
              </View>
            </ViewShot>
          </ScrollView>

          {/* Action Row: Smart highlight depending on statement length */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isShortList ? '#16a34a' : '#475569' },
              ]}
              activeOpacity={0.85}
              onPress={handleDownloadJpg}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>
                    {isShortList ? '🖼️ JPG Download (1 Page)' : '🖼️ JPG Image'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: !isShortList ? '#0284c7' : '#0f172a' },
              ]}
              activeOpacity={0.85}
              onPress={handleExportPdf}
              disabled={isProcessing}
            >
              <Ionicons name="document-text-outline" size={15} color="#fff" />
              <Text style={styles.actionBtnText}>
                {!isShortList ? '📄 PDF Export (Multi-Page)' : '📄 PDF Print'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bill / Receipt Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.containerCard, { maxHeight: '92%', padding: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' }}>
                {previewInvoice ? '📄 Bill Preview' : '🧾 Receipt Preview'}
              </Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 6 }}>
              {isFetchingPreview ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text style={{ marginTop: 8, fontSize: 12, color: '#64748b', fontFamily: FONT.medium }}>Loading Document...</Text>
                </View>
              ) : (
                <ViewShot ref={previewShotRef} options={{ format: 'jpg', quality: 1.0 }} style={{ width: '100%', alignItems: 'center' }}>
                  {previewInvoice ? (
                    <BillPreview inv={previewInvoice} />
                  ) : previewReceipt ? (
                    <PaymentReceiptPreview inv={previewReceipt} />
                  ) : null}
                </ViewShot>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#16a34a' }]}
                onPress={() => shareInvoiceAsJpg(previewInvoice?.billNo || previewReceipt?.receiptNo || 'Document')}
                disabled={isSharingBill}
              >
                {isSharingBill ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Download JPG</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#475569' }]}
                onPress={() => setPreviewModalVisible(false)}
              >
                <Text style={styles.actionBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  containerCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '94%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  modalTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSubTitle: { fontSize: 10, fontFamily: FONT.medium, color: '#64748b' },

  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 6,
    marginTop: 6,
  },
  dateLabel: { fontSize: 8.5, fontFamily: FONT.bold, color: '#475569' },
  dateInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 10.5,
    fontFamily: FONT.medium,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  presetBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  presetBtnText: { color: '#ffffff', fontSize: 9.5, fontFamily: FONT.bold },

  slipCard: {
    width: 350,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 10,
    position: 'relative',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#16a34a',
  },
  slipHeaderUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingTop: 4,
    paddingBottom: 6,
    marginBottom: 6,
  },
  statementTitleText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#0f172a' },
  slipDateText: { fontSize: 8, fontFamily: FONT.medium, color: '#64748b' },
  brandTitleText: { fontSize: 13, fontFamily: FONT.extraBold, color: '#15803d' },
  brandTaglineText: { fontSize: 7.5, fontFamily: FONT.medium, color: '#64748b' },
  statusBadgePill: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  statusBadgeText: { fontSize: 7.5, fontFamily: FONT.bold, color: '#16a34a' },

  partyGridRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  partyBox: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden' },
  partyHeader: { paddingVertical: 2, paddingHorizontal: 5 },
  partyHeaderText: { fontSize: 7.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  partyBody: { padding: 5, gap: 1 },
  partyNameBold: { fontSize: 10.5, fontFamily: FONT.bold, color: '#0f172a' },
  partySubText: { fontSize: 8.5, fontFamily: FONT.medium, color: '#475569' },

  tableCard: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 4, paddingHorizontal: 6 },
  tableHeaderCell: { fontSize: 7.5, fontFamily: FONT.bold, color: '#ffffff' },
  tableBodyRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  tableCell: { fontSize: 9, fontFamily: FONT.medium, color: '#334155' },

  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingVertical: 5,
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 7.5, fontFamily: FONT.bold, color: '#64748b' },
  summaryValue: { fontSize: 11, fontFamily: FONT.extraBold },

  slipFooter: { alignItems: 'center', paddingTop: 4 },
  slipFooterText: { fontSize: 7.5, fontFamily: FONT.medium, color: '#94a3b8' },

  actionsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  actionBtnText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#ffffff' },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  closeBtnText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#475569' },
});
