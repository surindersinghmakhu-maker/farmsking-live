export interface Gstr8Record {
  gstin: string;
  legalName: string;
  tradeName: string;
  month: number;
  year: number;
  totalGrossSales: number;
  totalSalesReturn: number;
  netTaxableValue: number;
  cgstTcsAmount: number;
  sgstTcsAmount: number;
  igstTcsAmount: number;
  totalTcsAmount: number;
}

/** Convert GSTR-8 Report Data to standard CA CSV format for Government GST Portal Upload */
export function convertGstr8ToCsv(records: Gstr8Record[]): string {
  const headers = [
    'GSTIN of Supplier',
    'Legal Name of Supplier',
    'Trade Name',
    'Month',
    'Year',
    'Gross Value of Supplies (₹)',
    'Value of Supplies Returned (₹)',
    'Net Amount Liable for TCS (₹)',
    'Integrated Tax TCS (₹)',
    'Central Tax TCS (₹)',
    'State/UT Tax TCS (₹)',
    'Total TCS Collected (₹)',
  ];

  const rows = records.map((r) => [
    `"${r.gstin || 'UNREGISTERED'}"`,
    `"${r.legalName || r.tradeName}"`,
    `"${r.tradeName}"`,
    r.month,
    r.year,
    r.totalGrossSales.toFixed(2),
    r.totalSalesReturn.toFixed(2),
    r.netTaxableValue.toFixed(2),
    r.igstTcsAmount.toFixed(2),
    r.cgstTcsAmount.toFixed(2),
    r.sgstTcsAmount.toFixed(2),
    r.totalTcsAmount.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
