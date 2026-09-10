import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatInr } from '@/src/utils/formatInr';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useLabourWorkers, useLabourWorkEntries, useLabourPayments } from '@/src/hooks/useLabour';
import { useMyCrops } from '@/src/hooks/useCrops';
import { useAuth } from '@/src/store/auth-context';
import { BrandLogo } from '@/src/components/BrandLogo';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface CropAnalysisItem {
  cropId?: string;
  cropName: string;
  fieldName?: string;
  fieldCount?: number;
  income: number;
  expense: number;
  net: number;
}

interface ProfessionalOverviewViewProps {
  totalSalesRevenue: number;
  totalSpent: number;
  overallNet: number;
  totalReceivable: number;
  totalPayable: number;
  salesCount: number;
  expenseCount: number;
  cropAnalysis: CropAnalysisItem[];
  salesRecords?: any[];
  expenses?: any[];
  onNavigateTab: (tab: 'SALES' | 'EXPENSES' | 'LABOUR' | 'ANALYSIS', subTab?: 'RECEIVABLE' | 'PAYABLE') => void;
  onOpenSaleForm: () => void;
  onOpenExpenseForm: () => void;
}

export function ProfessionalOverviewView({
  totalSalesRevenue,
  totalSpent,
  overallNet,
  totalReceivable,
  totalPayable,
  salesCount,
  expenseCount,
  cropAnalysis,
  salesRecords = [],
  expenses = [],
  onNavigateTab,
  onOpenSaleForm,
  onOpenExpenseForm,
}: ProfessionalOverviewViewProps) {
  const isOverallProfit = overallNet >= 0;
  const [selectedCropForStatement, setSelectedCropForStatement] = useState<{ cropName: string; fieldName?: string } | null>(null);

  // Profit margin percentage
  const profitMarginPercent = useMemo(() => {
    if (totalSalesRevenue <= 0) return 0;
    const margin = (overallNet / totalSalesRevenue) * 100;
    return Math.max(0, Math.min(100, Math.round(margin)));
  }, [overallNet, totalSalesRevenue]);

  // Labour data digest
  const { data: labourWorkers = [] } = useLabourWorkers();
  const totalLabourEarned = useMemo(
    () => labourWorkers.reduce((acc, w) => acc + (w.totalEarned || 0), 0),
    [labourWorkers]
  );
  const totalLabourPaid = useMemo(
    () => labourWorkers.reduce((acc, w) => acc + (w.totalPaid || 0), 0),
    [labourWorkers]
  );
  const totalLabourPending = useMemo(
    () => labourWorkers.reduce((acc, w) => acc + (w.pendingBalance || 0), 0),
    [labourWorkers]
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Ultra-Compact Executive Financial Hero Header */}
      <View style={[styles.heroCard, premiumShadow('#0f172a', 'sm')]}>
        {/* Top Header Strip */}
        <View style={styles.heroTopStrip}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="stats-chart" size={15} color="#15803d" />
              <Text style={styles.heroHeaderTitle}>Farm Net Financial Outcome</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={[styles.netBoxValue, { color: isOverallProfit ? '#16a34a' : '#dc2626' }]}>
                {isOverallProfit ? '+' : '-'}{formatInr(Math.abs(overallNet))}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.netStatusPill,
              { backgroundColor: isOverallProfit ? '#dcfce7' : '#fee2e2', borderColor: isOverallProfit ? '#86efac' : '#fca5a5' },
            ]}
          >
            <Text style={[styles.netStatusPillText, { color: isOverallProfit ? '#15803d' : '#dc2626' }]}>
              {isOverallProfit ? '📈 PROFIT' : '📉 LOSS'}
            </Text>
          </View>
        </View>

        {/* Income vs Expense Progress Track */}
        {totalSalesRevenue > 0 ? (
          <View style={styles.progressSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={styles.progressLabel}>Profit Retention Margin</Text>
              <Text style={[styles.progressVal, { color: isOverallProfit ? '#16a34a' : '#dc2626' }]}>
                {profitMarginPercent}% Margin
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${profitMarginPercent}%`, backgroundColor: isOverallProfit ? '#16a34a' : '#dc2626' },
                ]}
              />
            </View>
          </View>
        ) : null}

        {/* Compact 2x2 Metric Grid */}
        <View style={styles.gridContainer}>
          {/* Card 1: Sales Revenue */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              onNavigateTab('SALES');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.gridCardLabel, { color: '#166534' }]}>Income (+)</Text>
              <Ionicons name="trending-up" size={14} color="#16a34a" />
            </View>
            <Text style={[styles.gridCardValue, { color: '#15803d' }]}>+{formatInr(totalSalesRevenue)}</Text>
            <Text style={styles.gridCardSub}>{salesCount} Sales ➔</Text>
          </TouchableOpacity>

          {/* Card 2: Total Expenses */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              onNavigateTab('EXPENSES');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.gridCardLabel, { color: '#991b1b' }]}>Expenses (-)</Text>
              <Ionicons name="receipt" size={14} color="#dc2626" />
            </View>
            <Text style={[styles.gridCardValue, { color: '#dc2626' }]}>-{formatInr(totalSpent)}</Text>
            <Text style={styles.gridCardSub}>{expenseCount} Logs ➔</Text>
          </TouchableOpacity>

          {/* Card 3: Receivables */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              onNavigateTab('ANALYSIS', 'RECEIVABLE');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.gridCardLabel, { color: '#075985' }]}>Receivable</Text>
              <Ionicons name="arrow-down-circle" size={14} color="#0284c7" />
            </View>
            <Text style={[styles.gridCardValue, { color: '#0369a1' }]}>{formatInr(totalReceivable)}</Text>
            <Text style={styles.gridCardSub}>View Ledger ➔</Text>
          </TouchableOpacity>

          {/* Card 4: Payables */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              onNavigateTab('ANALYSIS', 'PAYABLE');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.gridCardLabel, { color: '#9a3412' }]}>Payable</Text>
              <Ionicons name="arrow-up-circle" size={14} color="#ea580c" />
            </View>
            <Text style={[styles.gridCardValue, { color: '#c2410c' }]}>{formatInr(totalPayable)}</Text>
            <Text style={styles.gridCardSub}>View Ledger ➔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Compact Crop-Wise Breakdown */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={styles.sectionTitle}>🌱 Crop Performance Overview</Text>
          <Text style={styles.sectionSubTitle}>{cropAnalysis.length} Active Field{cropAnalysis.length === 1 ? '' : 's'}</Text>
        </View>

        {cropAnalysis.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="leaf-outline" size={24} color="#cbd5e1" />
            <Text style={styles.emptyText}>No Active Crops</Text>
            <Text style={styles.emptySubText}>Add active crops to track profitability per crop field.</Text>
          </View>
        ) : (
          <View style={[{ backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#94a3b8', overflow: 'hidden' }, premiumShadow('#0f172a', 'sm')]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: 460, flexGrow: 1 }}>
              <View style={{ flex: 1, minWidth: 460 }}>
                {/* Table Header */}
                <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center' }}>
                  <Text style={{ flex: 1, minWidth: 125, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>CROP & FIELD NAME</Text>
                  <Text style={{ width: 78, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'right', paddingRight: 2 }}>INCOME</Text>
                  <Text style={{ width: 78, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'right', paddingRight: 2 }}>EXPENSE</Text>
                  <Text style={{ width: 108, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'center' }}>NET PROFIT/LOSS</Text>
                  <Text style={{ width: 66, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff', textAlign: 'center' }}>ACTION</Text>
                </View>

                {/* Table Rows */}
                {cropAnalysis.map((c, idx) => {
                  const isProfit = c.net >= 0;
                  return (
                    <View
                      key={c.cropId || `${c.cropName}_${c.fieldName}_${idx}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 8,
                        paddingVertical: 5.5,
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f1f5f9',
                        borderBottomWidth: idx === cropAnalysis.length - 1 ? 0 : 1,
                        borderBottomColor: '#cbd5e1',
                      }}
                    >
                      {/* Crop Name & Field Name (Inline Compact) */}
                      <View style={{ flex: 1, minWidth: 125, flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 2 }}>
                        <Ionicons name="leaf" size={11.5} color="#16a34a" />
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
                          {c.cropName}
                        </Text>
                        {c.fieldName ? (
                          <View style={{ backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 4, paddingVertical: 0.5, borderRadius: 3 }}>
                            <Text style={{ fontSize: 8.5, fontFamily: FONT.bold, color: '#334155' }} numberOfLines={1}>
                              📍 {c.fieldName}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Income */}
                      <View style={{ width: 78, alignItems: 'flex-end', paddingRight: 2 }}>
                        <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' }}>
                            +{formatInr(c.income)}
                          </Text>
                        </View>
                      </View>

                      {/* Expense */}
                      <View style={{ width: 78, alignItems: 'flex-end', paddingRight: 2 }}>
                        <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#dc2626' }}>
                            -{formatInr(c.expense)}
                          </Text>
                        </View>
                      </View>

                      {/* Profit / Loss Badge */}
                      <View style={{ width: 108, alignItems: 'center' }}>
                        <View
                          style={[
                            styles.cropProfitBadge,
                            { backgroundColor: isProfit ? '#dcfce7' : '#fee2e2', paddingHorizontal: 5, paddingVertical: 1.5 },
                          ]}
                        >
                          <Text style={[styles.cropProfitBadgeText, { color: isProfit ? '#15803d' : '#dc2626', fontSize: 9 }]}>
                            {isProfit ? `▲ Profit: +${formatInr(c.net)}` : `▼ Loss: -${formatInr(Math.abs(c.net))}`}
                          </Text>
                        </View>
                      </View>

                      {/* Statement Action Button */}
                      <View style={{ width: 66, alignItems: 'center' }}>
                        <TouchableOpacity
                          style={[styles.cropStatementBtn, { paddingHorizontal: 5, paddingVertical: 1.5 }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            tap();
                            setSelectedCropForStatement({ cropName: c.cropName, fieldName: c.fieldName });
                          }}
                        >
                          <Ionicons name="document-text-outline" size={9.5} color="#0284c7" />
                          <Text style={[styles.cropStatementBtnText, { fontSize: 9 }]}>Statement</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* 3. Compact Labour Digest */}
      <TouchableOpacity
        style={[styles.labourDigestCard, premiumShadow('#0f172a', 'sm')]}
        activeOpacity={0.85}
        onPress={() => {
          tap();
          onNavigateTab('LABOUR');
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.labourIconBg}>
              <Ionicons name="people" size={14} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.labourTitle}>Labour Workers Overview</Text>
              <Text style={styles.labourSub}>
                {labourWorkers.length} Worker{labourWorkers.length === 1 ? '' : 's'} Registered
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748b" />
        </View>

        <View style={styles.labourMetricsRow}>
          <View style={styles.labourMetricItem}>
            <Text style={styles.labourMetricLabel}>Labour Earned</Text>
            <Text style={[styles.labourMetricVal, { color: '#c2410c' }]}>{formatInr(totalLabourEarned)}</Text>
          </View>
          <View style={styles.labourMetricDivider} />
          <View style={styles.labourMetricItem}>
            <Text style={styles.labourMetricLabel}>Labour Paid</Text>
            <Text style={[styles.labourMetricVal, { color: '#16a34a' }]}>{formatInr(totalLabourPaid)}</Text>
          </View>
          <View style={styles.labourMetricDivider} />
          <View style={styles.labourMetricItem}>
            <Text style={styles.labourMetricLabel}>Pending Balance</Text>
            <Text
              style={[
                styles.labourMetricVal,
                { color: totalLabourPending > 0 ? '#dc2626' : '#16a34a' },
              ]}
            >
              {formatInr(totalLabourPending)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 4. Quick Action CTA Bar */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: '#16a34a' }]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            onOpenSaleForm();
          }}
        >
          <Ionicons name="add-circle" size={14} color="#ffffff" />
          <Text style={styles.ctaBtnText}>+ New Sale Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: '#dc2626' }]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            onOpenExpenseForm();
          }}
        >
          <Ionicons name="remove-circle" size={14} color="#ffffff" />
          <Text style={styles.ctaBtnText}>+ New Expense Log</Text>
        </TouchableOpacity>
      </View>

      {/* CROP STATEMENT MODAL */}
      {selectedCropForStatement && (
        <CropStatementModal
          cropName={selectedCropForStatement.cropName}
          fieldName={selectedCropForStatement.fieldName}
          salesRecords={salesRecords}
          expenses={expenses}
          onClose={() => setSelectedCropForStatement(null)}
        />
      )}
    </ScrollView>
  );
}

/** Crop Statement Modal Component */
function CropStatementModal({
  cropName,
  fieldName,
  salesRecords = [],
  expenses = [],
  onClose,
}: {
  cropName: string;
  fieldName?: string;
  salesRecords?: any[];
  expenses?: any[];
  onClose: () => void;
}) {
  const { user } = useAuth();

  const { data: myCrops = [] } = useMyCrops();
  const foundCrop = useMemo(() => {
    return (myCrops || []).find(
      (c) => c.cropName && c.cropName.toLowerCase().trim() === cropName.toLowerCase().trim()
    );
  }, [myCrops, cropName]);

  const { data: rawLabourWork = [] } = useLabourWorkEntries();

  const farmerName = user?.name || 'Farm Owner';
  const farmerMobile = user?.mobile || '';
  const farmerVillage = user?.village || '';

  // Filter sales, expenses and labour work entries for this crop
  const { timeline, totalIncome, totalExpense, netMargin } = useMemo(() => {
    const safeStr = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val.toLowerCase().trim();
      if (typeof val === 'object' && val.name) return String(val.name).toLowerCase().trim();
      if (typeof val === 'object' && val.label) return String(val.label).toLowerCase().trim();
      return String(val).toLowerCase().trim();
    };

    const norm = (val: any): string => safeStr(val).replace(/[^\w]/g, '');

    const nCropName = norm(cropName); // e.g. "marigold"

    // Collect all matching Crop IDs for this cropName from myCrops
    const matchingCropIds = new Set<string>();
    (myCrops || []).forEach((c) => {
      const cNorm = norm(c.cropName);
      if (cNorm && (cNorm.includes(nCropName) || nCropName.includes(cNorm))) {
        if (c.id) matchingCropIds.add(safeStr(c.id));
        if (c.cropId) matchingCropIds.add(safeStr(c.cropId));
      }
    });

    // 1. Filter Sales (strictly matching this crop)
    const matchedSales = salesRecords.filter((s) => {
      const sCropName = norm(s.cropName);
      const sCropId = safeStr(s.cropId);
      const sNotes = norm(s.notes || s.remarks || s.comment);

      if (sCropName && (sCropName.includes(nCropName) || nCropName.includes(sCropName))) return true;
      if (sCropId && matchingCropIds.has(sCropId)) return true;
      if (sNotes && sNotes.includes(nCropName)) return true;
      return false;
    });

    // 2. Filter Expenses (ONLY explicitly tagged to this crop, exclude OTHER / general farm expenses)
    const matchedExpenses = expenses.filter((e) => {
      // Do not link general OTHER expenses to any crop
      if (e.cropType === 'OTHER' || e.isOtherCrop) return false;

      const eCrop = norm(e.cropName);
      const eCropId = safeStr(e.cropId || e.cropCycleId || e.cropCycle?.id);
      const eNotes = norm(e.notes || e.comments || e.particulars || e.description);

      if (eCrop && (eCrop.includes(nCropName) || nCropName.includes(eCrop))) return true;
      if (eCropId && matchingCropIds.has(eCropId)) return true;
      if (eNotes && eNotes.includes(nCropName)) return true;
      return false;
    });

    // 3. Filter Labour Work Entries (strictly matching this crop)
    const matchedLabourWork = (rawLabourWork || []).filter((w: any) => {
      const wCrop = norm(w.cropName || w.cropCycle?.cropName);
      const wCropId = safeStr(w.cropId || w.cropCycleId || w.cropCycle?.id);
      const wNotes = norm(w.notes || w.comments || w.particulars || w.workType);

      if (wCrop && (wCrop.includes(nCropName) || nCropName.includes(wCrop))) return true;
      if (wCropId && matchingCropIds.has(wCropId)) return true;
      if (wNotes && wNotes.includes(nCropName)) return true;
      return false;
    });

    const totalInc = matchedSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const totalExp =
      matchedExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0) +
      matchedLabourWork.reduce((acc, w: any) => acc + (Number(w.totalAmount) || 0), 0);

    // 4. Build unified datewise ledger items
    const items: Array<{
      id: string;
      date: string;
      rawDate: Date;
      type: 'INCOME' | 'EXPENSE';
      category: string;
      comments: string;
      incomeAmt: number;
      expenseAmt: number;
    }> = [];

    matchedSales.forEach((s, idx) => {
      const dStr = s.saleDate || s.createdAt || new Date().toISOString();
      const buyerInfo = s.buyerName ? `Buyer: ${s.buyerName}` : 'Direct Sale';
      const qtyInfo = s.quantity ? `${s.quantity} ${s.unit || 'Quintal'}` : '';
      const userNotes = s.notes || s.remarks || s.comment || '';

      const fullComments = [buyerInfo, qtyInfo, userNotes].filter(Boolean).join(' | ');

      items.push({
        id: `sale_${s.id || idx}`,
        date: dStr,
        rawDate: new Date(dStr),
        type: 'INCOME',
        category: '🌾 Sale Income',
        comments: fullComments || 'Crop Sale Recorded',
        incomeAmt: Number(s.totalAmount) || 0,
        expenseAmt: 0,
      });
    });

    matchedExpenses.forEach((e, idx) => {
      const dStr = e.expenseDate || e.createdAt || new Date().toISOString();
      const catName = typeof e.categoryName === 'string'
        ? e.categoryName
        : typeof e.category === 'string'
          ? e.category
          : typeof e.category === 'object' && e.category?.name
            ? e.category.name
            : 'Farm Expense';

      const catLabel = `🚜 ${catName}`;
      const vendorInfo = e.vendorName ? `Vendor: ${e.vendorName}` : '';
      const userNotes = e.notes || e.comments || e.particulars || '';

      const fullComments = [vendorInfo, userNotes].filter(Boolean).join(' | ');

      items.push({
        id: `exp_${e.id || idx}`,
        date: dStr,
        rawDate: new Date(dStr),
        type: 'EXPENSE',
        category: catLabel,
        comments: fullComments || 'Crop Expense Logged',
        incomeAmt: 0,
        expenseAmt: Number(e.amount) || 0,
      });
    });

    matchedLabourWork.forEach((w: any, idx: number) => {
      const dStr = w.workDate || w.date || w.createdAt || new Date().toISOString();
      const workerInfo = w.workerName ? `Worker: ${w.workerName}` : 'Labour Work';
      const typeInfo = w.workType ? `Work: ${w.workType}` : '';
      const qtyInfo = w.unitsCount ? `${w.unitsCount} ${w.unit || 'Days'}` : '';
      const userNotes = w.notes || w.comments || w.particulars || '';

      const fullComments = [workerInfo, typeInfo, qtyInfo, userNotes].filter(Boolean).join(' | ');

      items.push({
        id: `labour_work_${w.id || idx}`,
        date: dStr,
        rawDate: new Date(dStr),
        type: 'EXPENSE',
        category: `👷 Labour Work (${w.workerName || 'Worker'})`,
        comments: fullComments || 'Labour Work Logged',
        incomeAmt: 0,
        expenseAmt: Number(w.totalAmount) || 0,
      });
    });

    // Sort chronologically (oldest to newest for correct running balance)
    items.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    let runningBal = 0;
    const itemsWithBalance = items.map((item) => {
      runningBal += item.incomeAmt - item.expenseAmt;
      return { ...item, runningBalance: runningBal };
    });

    return {
      timeline: itemsWithBalance,
      totalIncome: totalInc,
      totalExpense: totalExp,
      netMargin: totalInc - totalExp,
    };
  }, [cropName, salesRecords, expenses]);

  const isProfit = netMargin >= 0;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.modalOverlay}>
        <View style={[modalStyles.modalCard, { maxWidth: 560, maxHeight: '90%', padding: 14 }]}>
          {/* Modal Header */}
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>📜 {cropName} Performance Statement</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* 1. TOP HEADING: FarmsKing Logo & Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2.5, borderBottomColor: '#16a34a', paddingBottom: 8, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BrandLogo size={34} useHdQuality />
                <View>
                  <Text style={{ fontSize: 18, fontFamily: FONT.extraBold, color: '#15803d', letterSpacing: -0.3 }}>FarmsKing</Text>
                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }}>CROP STATEMENT</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' }}>Date: {new Date().toLocaleDateString('en-IN')}</Text>
                <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#16a34a' }}>Crop Performance Ledger</Text>
              </View>
            </View>

            {/* 2 & 3. FARMER DETAILS (LEFT) & CROP DETAILS (RIGHT) SIDE-BY-SIDE */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {/* Farmer Details Box (Left) */}
              <View style={{ flex: 1, backgroundColor: '#f0fdf4', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#bbf7d0' }}>
                <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#15803d', marginBottom: 2 }}>👨‍🌾 FARMER DETAILS</Text>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>{farmerName}</Text>
                {farmerMobile ? <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📱 {farmerMobile}</Text> : null}
                {farmerVillage ? <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📍 {farmerVillage}</Text> : null}
              </View>

              {/* Crop Details Box (Right) */}
              <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#475569', marginBottom: 2 }}>🌱 CROP DETAILS</Text>
                
                {/* Crop Name & ID */}
                <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#15803d' }}>
                  {foundCrop?.cropName || cropName} {foundCrop?.cropId ? `(ID: ${foundCrop.cropId})` : foundCrop?.id ? `(ID: CR-${foundCrop.id.slice(0, 6).toUpperCase()})` : ''}
                </Text>

                {/* Variety (Subcategory) */}
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#0f172a', marginTop: 2 }}>
                  🌱 Variety: <Text style={{ color: '#15803d' }}>{foundCrop?.variety || 'Thailand'}</Text>
                </Text>

                {/* Area & No. of Plants */}
                <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#334155', marginTop: 1.5 }}>
                  📏 Area: {foundCrop?.area ? `${foundCrop.area} ${foundCrop.plot?.areaUnit || 'Killa (Acre)'}` : '1 Killa (Acre)'}
                </Text>

                <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#334155', marginTop: 1.5 }}>
                  🪴 No. of Plants: {foundCrop?.plantCount ? foundCrop.plantCount.toLocaleString('en-IN') : '12,000'}
                </Text>

                {/* Sowing Date if present */}
                {foundCrop?.sowingDate ? (
                  <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                    📅 Sowing: {new Date(foundCrop.sowingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* FINANCIAL SUMMARY METRICS */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#f0fdf4', padding: 6, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
                <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' }}>Total Income (+)</Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#16a34a' }}>+{formatInr(totalIncome)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#fef2f2', padding: 6, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#fecdd3' }}>
                <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#b91c1c' }}>Total Expense (-)</Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#dc2626' }}>-{formatInr(totalExpense)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: isProfit ? '#dcfce7' : '#fee2e2', padding: 6, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: isProfit ? '#86efac' : '#fca5a5' }}>
                <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: isProfit ? '#15803d' : '#b91c1c' }}>
                  {isProfit ? 'Profit' : 'Loss'}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: isProfit ? '#15803d' : '#dc2626' }}>
                  {isProfit ? `▲ +${formatInr(netMargin)}` : `▼ -${formatInr(Math.abs(netMargin))}`}
                </Text>
              </View>
            </View>

            {/* 4. DATEWISE STATEMENT LEDGER TABLE WITH COMMENTS */}
            {timeline.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Ionicons name="receipt-outline" size={28} color="#94a3b8" />
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#64748b', marginTop: 4 }}>No Transactions Recorded for {cropName}</Text>
              </View>
            ) : (
              <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 8 }}>
                  <Text style={{ width: 60, fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' }}>Date</Text>
                  <Text style={{ flex: 2.2, fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' }}>Particulars / Comments</Text>
                  <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT.bold, color: '#bbf7d0', textAlign: 'right' }}>Income</Text>
                  <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT.bold, color: '#fca5a5', textAlign: 'right' }}>Expense</Text>
                </View>
                {timeline.map((row, idx) => (
                  <View key={row.id || idx} style={{ flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <Text style={{ width: 60, fontSize: 9.5, fontFamily: FONT.medium, color: '#475569' }}>
                      {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                    <View style={{ flex: 2.2 }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' }}>{row.category}</Text>
                      {row.comments ? (
                        <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>
                          💬 {row.comments}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{ flex: 1, fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a', textAlign: 'right' }}>
                      {row.type === 'INCOME' ? `+₹${row.incomeAmt.toLocaleString('en-IN')}` : '—'}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 10.5, fontFamily: FONT.bold, color: '#dc2626', textAlign: 'right' }}>
                      {row.type === 'EXPENSE' ? `-₹${row.expenseAmt.toLocaleString('en-IN')}` : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
  modalTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
});

const styles = StyleSheet.create({
  container: { padding: 8, gap: 8, paddingBottom: 20 },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  quickActionText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 6,
  },
  heroTopStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroHeaderTitle: { fontSize: 11, fontFamily: FONT.bold, color: '#334155' },
  netStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  netStatusPillText: { fontSize: 9.5, fontFamily: FONT.extraBold, letterSpacing: 0.2 },
  netBoxLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#64748b' },
  netBoxValue: { fontSize: 16, fontFamily: FONT.extraBold },
  progressSection: { gap: 2, marginVertical: 1 },
  progressLabel: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' },
  progressVal: { fontSize: 9.5, fontFamily: FONT.bold },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  gridCard: {
    width: '49%',
    borderRadius: RADIUS.sm,
    padding: 6,
    borderWidth: 1,
    gap: 1,
  },
  gridCardLabel: { fontSize: 9.5, fontFamily: FONT.bold },
  gridCardValue: { fontSize: 12.5, fontFamily: FONT.extraBold, marginTop: 1 },
  gridCardSub: { fontSize: 8.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  sectionTitle: { fontSize: 11.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  sectionSubTitle: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  emptyText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  emptySubText: { fontSize: 9.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
  cropCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.sm,
    padding: 7,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 5,
  },
  cropCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropName: { fontSize: 12, fontFamily: FONT.extraBold, color: '#0f172a' },
  cropProfitBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  cropProfitBadgeText: { fontSize: 9.5, fontFamily: FONT.extraBold },
  cropStatementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  cropStatementBtnText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  cropMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    padding: 4,
  },
  cropMetricBox: { flex: 1, alignItems: 'center' },
  cropMetricLabel: { fontSize: 8.5, fontFamily: FONT.bold, color: '#64748b' },
  cropMetricVal: { fontSize: 10.5, fontFamily: FONT.extraBold, marginTop: 1 },
  cropMetricDivider: { width: 1, height: 16, backgroundColor: '#e2e8f0' },
  labourDigestCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 7,
    borderWidth: 1,
    borderColor: '#94a3b8',
    gap: 6,
  },
  labourIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labourTitle: { fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' },
  labourSub: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b' },
  labourMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 5,
    borderRadius: RADIUS.sm,
  },
  labourMetricItem: { flex: 1, alignItems: 'center' },
  labourMetricLabel: { fontSize: 8.5, fontFamily: FONT.medium, color: '#64748b' },
  labourMetricVal: { fontSize: 10.5, fontFamily: FONT.extraBold, marginTop: 1 },
  labourMetricDivider: { width: 1, height: 16, backgroundColor: '#e2e8f0' },
  ctaRow: { flexDirection: 'row', gap: 5 },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  ctaBtnText: { color: '#ffffff', fontSize: 10.5, fontFamily: FONT.bold },
});
