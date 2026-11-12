import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiClient } from './client';

export type ComplianceCategory =
  | 'MCA_ROC'
  | 'GST'
  | 'INCOME_TAX_TDS'
  | 'AGRI_LICENSE'
  | 'PAYMENT_GATEWAY'
  | 'LEGAL_NOTICE'
  | 'AGREEMENT';

export type ComplianceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLIANT' | 'OVERDUE';

export interface StatutoryComplianceRecord {
  id: string;
  category: ComplianceCategory;
  title: string;
  authority?: string | null;
  referenceNo?: string | null;
  dueDate?: string | null;
  filedDate?: string | null;
  status: ComplianceStatus;
  assignedTo?: string | null;
  documentUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaTdsDeductee {
  deducteeId: string;
  deducteeName: string;
  role: string;
  section: string;
  panMasked: string | null;
  panMissing: boolean;
  grossAmount: number;
  tdsRate: number;
  tdsAmount: number;
}

export interface StoreComplianceAuditItem {
  storeId: string;
  storeName: string;
  legalName: string;
  sellerType: string;
  kycStatus: string;
  gstin: string | null;
  panMasked: string | null;
  ownerName?: string;
  ownerMobile?: string;
  cashfreeOnboarded: boolean;
  issues: string[];
  isCompliant: boolean;
}

export interface PartnerKycAuditItem {
  userId: string;
  name: string;
  kingId?: string | null;
  mobile: string;
  role: string;
  panMasked: string | null;
  hasBank: boolean;
  hasAadhaar: boolean;
  missing: string[];
  isKycReady: boolean;
}

export interface CaComplianceSummary {
  generatedAt: string;
  financialYear: string;
  currentQuarter: string;
  taxRatesApplied: {
    tcsSec52RatePercent: number;
    tds194OWithPanPercent: number;
    tds194OWithoutPanPercent: number;
    tds194HWithPanPercent: number;
    tds194HWithoutPanPercent: number;
    tds194JWithPanPercent: number;
    tds194JWithoutPanPercent: number;
  };
  financialAccounts: {
    totalOrdersCount: number;
    paidOrdersCount: number;
    grossOrderValue: number;
    totalPaidOrderValue: number;
    totalCouponDiscounts: number;
    totalWalletFees: number;
    totalWalletFeeGst: number;
    planSubscriptionRevenue: number;
    productGstOutput: number;
    productCgst: number;
    productSgst: number;
    productIgst: number;
    platformCommissionEarned: number;
    platformCommissionGst: number;
    pendingSellerPayout: number;
    settledSellerPayout: number;
    totalSec52Tcs: number;
    walletLiabilityTotal: number;
    activeWalletsCount: number;
    legacyWithdrawalsCount: number;
  };
  tdsSummary: {
    totalTds194O: number;
    totalTds194H: number;
    totalTds194J: number;
    totalTdsLiability: number;
    panMissingDeductees: number;
    deductees: CaTdsDeductee[];
    recordedChallanRows: any[];
  };
  gstr8Count: number;
  gstr8Reports: any[];
  invoices: any[];
  kycComplianceAudit: {
    stores: StoreComplianceAuditItem[];
    nonCompliantStoresCount: number;
    partners: PartnerKycAuditItem[];
    nonCompliantPartnersCount: number;
    tradersCount: number;
    tradersWithoutGstinCount: number;
  };
  companyRegistryReadiness: {
    companyLegalName: string;
    cin: string;
    rocJurisdiction: string;
    registeredAddress: string;
    operationalHq: string;
    gstinConfigured: boolean;
    gstin: string | null;
    panConfigured: boolean;
    pan: string | null;
    tanConfigured: boolean;
    tan: string | null;
    grievanceOfficerName: string;
    grievanceOfficerEmail: string;
    supportPhone: string;
    supportEmail: string;
    paymentGateways: {
      activeGateway: string;
      isSandbox: boolean;
      cashfreeConfigured: boolean;
      razorpayConfigured: boolean;
      phonepeConfigured: boolean;
      shiprocketConfigured: boolean;
    };
  };
  statutoryRecords: StatutoryComplianceRecord[];
}

export async function getCaSummary(): Promise<CaComplianceSummary> {
  const { data } = await apiClient.get<CaComplianceSummary>('/compliance/ca-summary');
  return data;
}

export async function listComplianceRecords(): Promise<StatutoryComplianceRecord[]> {
  const { data } = await apiClient.get<StatutoryComplianceRecord[]>('/compliance/records');
  return data;
}

export interface CreateComplianceRecordPayload {
  category: ComplianceCategory;
  title: string;
  authority?: string;
  referenceNo?: string;
  dueDate?: string;
  filedDate?: string;
  status?: ComplianceStatus;
  assignedTo?: 'ADVOCATE' | 'CA' | 'ACCOUNTANT' | 'DIRECTOR';
  documentUrl?: string;
  notes?: string;
}

export async function createComplianceRecord(payload: CreateComplianceRecordPayload): Promise<StatutoryComplianceRecord> {
  const { data } = await apiClient.post<StatutoryComplianceRecord>('/compliance/records', payload);
  return data;
}

export async function updateComplianceRecord(
  id: string,
  payload: Partial<CreateComplianceRecordPayload>,
): Promise<StatutoryComplianceRecord> {
  const { data } = await apiClient.patch<StatutoryComplianceRecord>(`/compliance/records/${id}`, payload);
  return data;
}

export async function downloadGstr8CsvFile(month: number, year: number): Promise<string> {
  const { data } = await apiClient.get<string>('/compliance/gstr8-csv', {
    params: { month, year },
    responseType: 'text' as any,
  });
  triggerCsvDownload(data, `farmsking-gstr8-${String(month).padStart(2, '0')}-${year}.csv`);
  return data;
}

export async function downloadTdsCsvFile(section?: string): Promise<string> {
  const { data } = await apiClient.get<string>('/compliance/tds-csv', {
    params: section ? { section } : undefined,
    responseType: 'text' as any,
  });
  triggerCsvDownload(data, `farmsking-tds-26q-${section || 'ALL'}.csv`);
  return data;
}

function triggerCsvDownload(csvText: string, filename: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

function escHtml(v: string | number | null | undefined): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inr(v: number): string {
  return 'Rs. ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Prints or shares a strict A4 (210mm x 297mm, 12mm/15mm margins) Statutory CA & Advocate Statement per User Rule 4.
 */
export async function printA4StatutoryReport(summary: CaComplianceSummary, mode: 'CA_ACCOUNTS' | 'ADVOCATE_STATUTORY') {
  const co = summary.companyRegistryReadiness;
  const fa = summary.financialAccounts;
  const tds = summary.tdsSummary;
  const isCa = mode === 'CA_ACCOUNTS';

  const deducteeRowsHtml = tds.deductees
    .slice(0, 40)
    .map(
      (d) => `
      <tr>
        <td>${escHtml(d.deducteeName)}</td>
        <td>${escHtml(d.role)}</td>
        <td>${escHtml(d.section)}</td>
        <td>${d.panMissing ? '<span style="color:#b91c1c;font-weight:700">MISSING (20%)</span>' : escHtml(d.panMasked)}</td>
        <td style="text-align:right">${inr(d.grossAmount)}</td>
        <td style="text-align:right">${d.tdsRate.toFixed(1)}%</td>
        <td style="text-align:right;font-weight:700">${inr(d.tdsAmount)}</td>
      </tr>`,
    )
    .join('');

  const recordRowsHtml = summary.statutoryRecords
    .map(
      (r) => `
      <tr>
        <td>${escHtml(r.category)}</td>
        <td>${escHtml(r.title)}</td>
        <td>${escHtml(r.authority || '-')}</td>
        <td>${escHtml(r.referenceNo || 'Pending')}</td>
        <td>${escHtml(r.assignedTo || 'ADVOCATE')}</td>
        <td style="font-weight:700;color:${r.status === 'COMPLIANT' ? '#047857' : '#b45309'}">${escHtml(r.status)}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${isCa ? 'FarmsKing CA & Tax Audit Statement' : 'FarmsKing Statutory & Advocate Compliance Dossier'}</title>
<style>
  @page { size: A4; margin: 12mm 15mm; }
  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
  body { margin: 0; font-size: 10.5px; line-height: 1.45; }
  .header { border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
  .co-name { font-size: 15px; font-weight: 800; color: #064e3b; }
  .meta { font-size: 9.5px; color: #475569; margin-top: 2px; }
  .badge { background: #ecfdf5; border: 1px solid #059669; color: #065f46; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; }
  h2 { font-size: 12px; margin: 14px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1; color: #0f172a; page-break-after: avoid; }
  .grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; page-break-inside: avoid; }
  .kpi { flex: 1; min-width: 28%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px; background: #f8fafc; }
  .kpi-lbl { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
  .kpi-val { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; page-break-inside: auto; }
  th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; font-size: 9.5px; }
  th { background: #f1f5f9; font-weight: 700; }
  tr { page-break-inside: avoid; }
  .footer { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="co-name">${escHtml(co.companyLegalName)}</div>
      <div class="meta">CIN: ${escHtml(co.cin)} | ${escHtml(co.rocJurisdiction)}</div>
      <div class="meta">Regd. Office: ${escHtml(co.registeredAddress)}</div>
      <div class="meta">Ops HQ: ${escHtml(co.operationalHq)}</div>
      <div class="meta">GSTIN: ${escHtml(co.gstin || 'Pending Registration')} | PAN: ${escHtml(co.pan || 'Pending')} | TAN: ${escHtml(co.tan || 'Pending')}</div>
    </div>
    <div style="text-align:right">
      <div class="badge">${isCa ? 'CA / ACCOUNTANT AUDIT' : 'ADVOCATE STATUTORY DOSSIER'}</div>
      <div class="meta" style="margin-top:4px">FY: ${escHtml(summary.financialYear)} (${escHtml(summary.currentQuarter)})</div>
      <div class="meta">Generated: ${new Date(summary.generatedAt).toLocaleString('en-IN')}</div>
    </div>
  </div>

  ${
    isCa
      ? `
  <h2>1. Executive Revenue, GST Output &amp; Settlement Statement</h2>
  <div class="grid">
    <div class="kpi"><div class="kpi-lbl">Gross Order Value</div><div class="kpi-val">${inr(fa.grossOrderValue)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Paid Order Value (${fa.paidOrdersCount}/${fa.totalOrdersCount})</div><div class="kpi-val">${inr(fa.totalPaidOrderValue)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Plan Subscriptions</div><div class="kpi-val">${inr(fa.planSubscriptionRevenue)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Product Output GST</div><div class="kpi-val">${inr(fa.productGstOutput)}</div></div>
    <div class="kpi"><div class="kpi-lbl">CGST / SGST / IGST</div><div class="kpi-val">${inr(fa.productCgst)} / ${inr(fa.productSgst)} / ${inr(fa.productIgst)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Platform Commission + 18% GST</div><div class="kpi-val">${inr(fa.platformCommissionEarned)} + ${inr(fa.platformCommissionGst)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Sec 52 GST TCS (0.5%)</div><div class="kpi-val">${inr(fa.totalSec52Tcs)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Seller Payouts (Pending / Settled)</div><div class="kpi-val">${inr(fa.pendingSellerPayout)} / ${inr(fa.settledSellerPayout)}</div></div>
    <div class="kpi"><div class="kpi-lbl">User Wallet Liability (${fa.activeWalletsCount})</div><div class="kpi-val">${inr(fa.walletLiabilityTotal)}</div></div>
  </div>

  <h2>2. Income Tax TDS Register (Sec 194-O Vendors, Sec 194-H Agents, Sec 194-J Professionals)</h2>
  <div class="grid">
    <div class="kpi"><div class="kpi-lbl">Sec 194-O (0.1% / 5%)</div><div class="kpi-val">${inr(tds.totalTds194O)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Sec 194-H (2% / 20%)</div><div class="kpi-val">${inr(tds.totalTds194H)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Sec 194-J (10% / 20%)</div><div class="kpi-val">${inr(tds.totalTds194J)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Total TDS Payable</div><div class="kpi-val">${inr(tds.totalTdsLiability)}</div></div>
    <div class="kpi"><div class="kpi-lbl">206AA Missing PAN Cases</div><div class="kpi-val" style="color:${tds.panMissingDeductees > 0 ? '#b91c1c' : '#047857'}">${tds.panMissingDeductees}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Deductee</th><th>Role</th><th>Section</th><th>PAN Status</th>
        <th style="text-align:right">Gross (INR)</th><th style="text-align:right">Rate</th><th style="text-align:right">TDS (INR)</th>
      </tr>
    </thead>
    <tbody>${deducteeRowsHtml || '<tr><td colspan="7">No taxable deductee settlements recorded yet.</td></tr>'}</tbody>
  </table>`
      : `
  <h2>1. Corporate, Gateway &amp; KYC Audit Snapshot</h2>
  <div class="grid">
    <div class="kpi"><div class="kpi-lbl">Company GSTIN / PAN / TAN</div><div class="kpi-val">${co.gstinConfigured ? 'GST Ready' : 'GST Pending'} · ${co.panConfigured ? 'PAN Ready' : 'PAN Pending'} · ${co.tanConfigured ? 'TAN Ready' : 'TAN Pending'}</div></div>
    <div class="kpi"><div class="kpi-lbl">Non-Compliant Seller Stores</div><div class="kpi-val">${summary.kycComplianceAudit.nonCompliantStoresCount} / ${summary.kycComplianceAudit.stores.length}</div></div>
    <div class="kpi"><div class="kpi-lbl">Partners Missing PAN/KYC</div><div class="kpi-val">${summary.kycComplianceAudit.nonCompliantPartnersCount} / ${summary.kycComplianceAudit.partners.length}</div></div>
    <div class="kpi"><div class="kpi-lbl">Grievance Officer (Sec 79)</div><div class="kpi-val">${escHtml(co.grievanceOfficerName)} (${escHtml(co.grievanceOfficerEmail)})</div></div>
  </div>
  <h2>2. MCA / ROC, Tax, License &amp; Legal Filings Register</h2>
  <table>
    <thead>
      <tr><th>Category</th><th>Filing / Requirement</th><th>Authority</th><th>Ref / SRN</th><th>Owner</th><th>Status</th></tr>
    </thead>
    <tbody>${recordRowsHtml}</tbody>
  </table>`
  }

  <div class="footer">
    <span>Grievance Officer: ${escHtml(co.grievanceOfficerName)} | ${escHtml(co.supportPhone)} | ${escHtml(co.supportEmail)}</span>
    <span>Standard A4 Statutory Statement (210mm x 297mm)</span>
  </div>
</body>
</html>`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const win = window.open('', '_blank', 'width=960,height=1100');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
      return;
    }
  }
  const file = await Print.printToFileAsync({ html, width: 595, height: 842 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: isCa ? 'Share A4 CA Statement' : 'Share A4 Legal Dossier',
    });
  }
}

