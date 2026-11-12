import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import {
  downloadGstr8CsvFile,
  downloadTdsCsvFile,
  printA4StatutoryReport,
} from '@/src/api/compliance.api';
import { useCaSummary } from '@/src/hooks/useCompliance';

const formatInr = (n: number | undefined | null) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AccountantCaReportView() {
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const { data: summary, isLoading, refetch, isFetching } = useCaSummary();
  const [downloadingGstr8, setDownloadingGstr8] = useState(false);
  const [downloadingTds, setDownloadingTds] = useState(false);
  const [printingA4, setPrintingA4] = useState(false);
  const [tdsFilter, setTdsFilter] = useState<'ALL' | '194O' | '194H' | '194J' | 'MISSING_PAN'>('ALL');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
    else Alert.alert(title, msg);
  };

  const handleDownloadGstr8 = async () => {
    try {
      setDownloadingGstr8(true);
      const now = new Date();
      await downloadGstr8CsvFile(now.getMonth() + 1, now.getFullYear());
      notify('GSTR-8 Export Ready', 'Monthly GSTR-8 CSV (0.5% Sec 52 TCS with CGST/SGST/IGST split) generated.');
    } catch (e: any) {
      notify('Export Error', e?.response?.data?.message || e?.message || 'Could not export GSTR-8 CSV.');
    } finally {
      setDownloadingGstr8(false);
    }
  };

  const handleDownloadTds = async () => {
    try {
      setDownloadingTds(true);
      await downloadTdsCsvFile(tdsFilter === 'MISSING_PAN' || tdsFilter === 'ALL' ? undefined : tdsFilter);
      notify('TDS 26Q Export Ready', 'Income Tax Form 26Q TDS Register CSV downloaded.');
    } catch (e: any) {
      notify('Export Error', e?.response?.data?.message || e?.message || 'Could not export TDS CSV.');
    } finally {
      setDownloadingTds(false);
    }
  };

  const handlePrintA4 = async () => {
    if (!summary) return;
    try {
      setPrintingA4(true);
      await printA4StatutoryReport(summary, 'CA_ACCOUNTS');
    } catch (e: any) {
      notify('Print Error', e?.message || 'Could not generate A4 CA statement.');
    } finally {
      setPrintingA4(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <View style={{ padding: 40, alignItems: 'center', gap: 10 }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ color: subTextColor, fontSize: 13, fontFamily: FONT.medium }}>
          Loading CA Financial Ledger, GST &amp; TDS 26Q Statements...
        </Text>
      </View>
    );
  }

  const co = summary.companyRegistryReadiness;
  const fa = summary.financialAccounts;
  const tds = summary.tdsSummary;
  const filteredDeductees = tds.deductees.filter((d) => {
    if (tdsFilter === 'ALL') return true;
    if (tdsFilter === 'MISSING_PAN') return d.panMissing;
    return d.section.startsWith(tdsFilter);
  });

  return (
    <View style={{ gap: 14 }}>
      {/* Executive Header Banner + A4 & CSV Exports */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: isLight ? '#ecfdf5' : '#062019', borderColor: isLight ? '#6ee7b7' : '#065f46' },
          premiumShadow('#059669', 'sm'),
        ]}
      >
        <View style={{ flex: 1, minWidth: 260 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calculator" size={18} color="#10b981" />
            <Text style={[styles.heroTitle, { color: textColor }]}>
              Accountant &amp; Chartered Accountant Desk
            </Text>
          </View>
          <Text style={[styles.heroSub, { color: subTextColor }]}>
            {co.companyLegalName} · CIN: {co.cin} · FY {summary.financialYear} ({summary.currentQuarter})
          </Text>
          <View style={styles.taxMetaRow}>
            <View style={[styles.metaChip, { borderColor: co.gstinConfigured ? '#10b981' : '#f59e0b' }]}>
              <Text style={[styles.metaChipText, { color: co.gstinConfigured ? '#10b981' : '#f59e0b' }]}>
                GSTIN: {co.gstin || 'Pending Registration'}
              </Text>
            </View>
            <View style={[styles.metaChip, { borderColor: co.panConfigured ? '#10b981' : '#f59e0b' }]}>
              <Text style={[styles.metaChipText, { color: co.panConfigured ? '#10b981' : '#f59e0b' }]}>
                PAN: {co.pan || 'Pending'}
              </Text>
            </View>
            <View style={[styles.metaChip, { borderColor: co.tanConfigured ? '#10b981' : '#f59e0b' }]}>
              <Text style={[styles.metaChipText, { color: co.tanConfigured ? '#10b981' : '#f59e0b' }]}>
                TAN: {co.tan || 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionBtnGroup}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#059669' }]}
            onPress={handlePrintA4}
            disabled={printingA4}
          >
            <Ionicons name="print-outline" size={15} color="#ffffff" />
            <Text style={styles.actionBtnText}>{printingA4 ? 'Preparing...' : 'A4 CA Statement'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#0284c7' }]}
            onPress={handleDownloadGstr8}
            disabled={downloadingGstr8}
          >
            <Ionicons name="download-outline" size={15} color="#ffffff" />
            <Text style={styles.actionBtnText}>{downloadingGstr8 ? 'Exporting...' : 'GSTR-8 CSV (0.5% TCS)'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]}
            onPress={handleDownloadTds}
            disabled={downloadingTds}
          >
            <Ionicons name="document-text-outline" size={15} color="#ffffff" />
            <Text style={styles.actionBtnText}>{downloadingTds ? 'Exporting...' : 'TDS 26Q CSV'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' }]}
            onPress={() => refetch()}
            disabled={isFetching}
          >
            <Ionicons name="refresh" size={15} color={isLight ? '#0f172a' : '#e2e8f0'} />
            <Text style={[styles.actionBtnText, { color: isLight ? '#0f172a' : '#e2e8f0' }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statutory Tax Rates Strip */}
      <View style={[styles.rateStrip, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.rateStripTitle, { color: subTextColor }]}>LIVE STATUTORY TAX ENGINE RATES:</Text>
        <Text style={[styles.rateItem, { color: textColor }]}>Sec 52 TCS: {summary.taxRatesApplied.tcsSec52RatePercent}%</Text>
        <Text style={[styles.rateItem, { color: textColor }]}>
          194-O (Vendors): {summary.taxRatesApplied.tds194OWithPanPercent}% / {summary.taxRatesApplied.tds194OWithoutPanPercent}%
        </Text>
        <Text style={[styles.rateItem, { color: textColor }]}>
          194-H (Agents): {summary.taxRatesApplied.tds194HWithPanPercent}% / {summary.taxRatesApplied.tds194HWithoutPanPercent}%
        </Text>
        <Text style={[styles.rateItem, { color: textColor }]}>
          194-J (Advisors/Doctors): {summary.taxRatesApplied.tds194JWithPanPercent}% / {summary.taxRatesApplied.tds194JWithoutPanPercent}%
        </Text>
      </View>

      {/* KPI Matrix — Revenue, GST Output, TCS & Wallet Liabilities */}
      <View style={styles.kpiGrid}>
        {[
          { label: 'Gross Order Value', val: formatInr(fa.grossOrderValue), sub: `${fa.totalOrdersCount} active orders`, color: '#10b981' },
          { label: 'Online Paid Value', val: formatInr(fa.totalPaidOrderValue), sub: `${fa.paidOrdersCount} paid orders`, color: '#059669' },
          { label: 'Plan Subscriptions Revenue', val: formatInr(fa.planSubscriptionRevenue), sub: 'Farmer, Advisor & Garden plans', color: '#0284c7' },
          { label: 'Product Output GST', val: formatInr(fa.productGstOutput), sub: `CGST ${formatInr(fa.productCgst)} · SGST ${formatInr(fa.productSgst)} · IGST ${formatInr(fa.productIgst)}`, color: '#f59e0b' },
          { label: 'Marketplace Commission', val: formatInr(fa.platformCommissionEarned), sub: `18% Comm GST Output: ${formatInr(fa.platformCommissionGst)}`, color: '#8b5cf6' },
          { label: 'Sec 52 GST TCS (0.5%)', val: formatInr(fa.totalSec52Tcs), sub: `${summary.gstr8Count} monthly GSTR-8 sheets`, color: '#ec4899' },
          { label: 'Seller Payout Liability', val: formatInr(fa.pendingSellerPayout), sub: `Settled to vendors: ${formatInr(fa.settledSellerPayout)}`, color: '#06b6d4' },
          { label: 'Active Wallet Liability', val: formatInr(fa.walletLiabilityTotal), sub: `${fa.activeWalletsCount} funded user wallets`, color: '#ef4444' },
        ].map((k) => (
          <View
            key={k.label}
            style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder, borderLeftColor: k.color, borderLeftWidth: 3 }]}
          >
            <Text style={[styles.kpiLabel, { color: subTextColor }]}>{k.label}</Text>
            <Text style={[styles.kpiValue, { color: textColor }]}>{k.val}</Text>
            <Text style={[styles.kpiSub, { color: subTextColor }]}>{k.sub}</Text>
          </View>
        ))}
      </View>

      {/* Income Tax TDS Section 194-O / 194-H / 194-J Register */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Income Tax TDS Deduction Register (Form 26Q)
            </Text>
            <Text style={[styles.sectionSub, { color: subTextColor }]}>
              194-O Vendors: {formatInr(tds.totalTds194O)} · 194-H Agents: {formatInr(tds.totalTds194H)} · 194-J Advisors: {formatInr(tds.totalTds194J)} · Total Liability: {formatInr(tds.totalTdsLiability)}
            </Text>
          </View>
          {tds.panMissingDeductees > 0 ? (
            <View style={[styles.alertChip, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: '#ef4444' }]}>
              <Ionicons name="warning" size={14} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 11, fontFamily: FONT.bold }}>
                {tds.panMissingDeductees} Missing PAN (Sec 206AA Applied)
              </Text>
            </View>
          ) : (
            <View style={[styles.alertChip, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10b981' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={{ color: '#10b981', fontSize: 11, fontFamily: FONT.bold }}>100% PAN Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.filterRow}>
          {[
            { id: 'ALL' as const, label: `All (${tds.deductees.length})` },
            { id: '194O' as const, label: 'Sec 194-O Vendors' },
            { id: '194H' as const, label: 'Sec 194-H Agents' },
            { id: '194J' as const, label: 'Sec 194-J Advisors' },
            { id: 'MISSING_PAN' as const, label: `Missing PAN (${tds.panMissingDeductees})` },
          ].map((f) => {
            const active = tdsFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setTdsFilter(f.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? '#059669' : isLight ? '#f1f5f9' : '#0f172a',
                    borderColor: active ? '#059669' : cardBorder,
                  },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: active ? '#ffffff' : subTextColor }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredDeductees.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-done-circle-outline" size={28} color="#10b981" />
            <Text style={[styles.emptyText, { color: subTextColor }]}>
              No deductee entries match this filter yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {filteredDeductees.slice(0, 30).map((d) => (
              <View
                key={`${d.section}-${d.deducteeId}`}
                style={[
                  styles.deducteeRow,
                  {
                    backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    borderColor: d.panMissing ? 'rgba(239,68,68,0.4)' : cardBorder,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deducteeName, { color: textColor }]}>{d.deducteeName}</Text>
                  <Text style={[styles.deducteeMeta, { color: subTextColor }]}>
                    Role: {d.role} · Section {d.section} · PAN:{' '}
                    <Text style={{ color: d.panMissing ? '#ef4444' : '#10b981', fontFamily: FONT.bold }}>
                      {d.panMissing ? 'NOT FURNISHED (20% 206AA)' : d.panMasked}
                    </Text>
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.deducteeTds, { color: textColor }]}>TDS {formatInr(d.tdsAmount)}</Text>
                  <Text style={[styles.deducteeMeta, { color: subTextColor }]}>
                    {d.tdsRate}% on {formatInr(d.grossAmount)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: { fontSize: 16, fontFamily: FONT.extraBold },
  heroSub: { fontSize: 11.5, fontFamily: FONT.medium, marginTop: 2 },
  taxMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  metaChipText: { fontSize: 11, fontFamily: FONT.bold },
  actionBtnGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  rateStrip: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'center',
  },
  rateStripTitle: { fontSize: 10.5, fontFamily: FONT.extraBold },
  rateItem: { fontSize: 11.5, fontFamily: FONT.bold },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1,
    minWidth: 215,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 4,
  },
  kpiLabel: { fontSize: 11, fontFamily: FONT.bold },
  kpiValue: { fontSize: 18, fontFamily: FONT.extraBold },
  kpiSub: { fontSize: 10.5, fontFamily: FONT.medium },
  sectionCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 14.5, fontFamily: FONT.extraBold },
  sectionSub: { fontSize: 11.5, fontFamily: FONT.medium, marginTop: 2 },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyBox: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium },
  deducteeRow: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  deducteeName: { fontSize: 13, fontFamily: FONT.bold },
  deducteeMeta: { fontSize: 11, fontFamily: FONT.medium, marginTop: 2 },
  deducteeTds: { fontSize: 13.5, fontFamily: FONT.extraBold },
});

