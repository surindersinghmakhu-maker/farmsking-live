export interface GroupedLedgerRow {
  id: string;
  date: string;
  billNo: string;
  reason: string;
  drAmount: number;
  crAmount: number;
  netChange: number;
  runningBalance: number;
  saleBillId?: string;
  paymentReceiptId?: string;
  rawEntries: any[];
}

export function buildPartyLedgerRows(entries: any[]): GroupedLedgerRow[] {
  if (!entries || entries.length === 0) return [];

  // Sort entries chronologically (oldest first) for accurate running balance calculation
  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
  );

  let runningBalance = 0;
  const rows: GroupedLedgerRow[] = [];

  sorted.forEach((e) => {
    let drAmount = 0;
    let crAmount = 0;

    if (e.type === 'SALE_CREDIT' || e.type === 'EXPENSE_PAYMENT') {
      drAmount = Number(e.amount) || 0;
    } else if (e.type === 'SALE_PAYMENT' || e.type === 'EXPENSE_CREDIT') {
      crAmount = Number(e.amount) || 0;
    }

    const netChange = drAmount - crAmount;
    runningBalance += netChange;

    // Determine Real Bill No / Receipt No (NEVER generate fake synthetic FK-XXXXXX)
    let billNo = '';
    if (e.saleBill?.billNo) {
      billNo = e.saleBill.billNo;
    } else if (e.paymentReceipt?.receiptNo) {
      billNo = e.paymentReceipt.receiptNo;
    } else if (e.reason) {
      const match = e.reason.match(/FK-[A-Za-z0-9]+/i);
      if (match) {
        billNo = match[0].toUpperCase();
      } else {
        const rctMatch = e.reason.match(/RCT-[A-Za-z0-9]+/i);
        if (rctMatch) {
          billNo = rctMatch[0].toUpperCase();
        }
      }
    }

    if (!billNo) {
      if (e.type === 'SALE_PAYMENT' || e.type === 'EXPENSE_PAYMENT') {
        billNo = 'Payment';
      } else {
        billNo = '—';
      }
    }

    // Format Reason / Particulars clearly
    let reason = e.reason || '';
    if (e.type === 'SALE_PAYMENT') {
      const cleanMsg = reason.replace(/^amount received against:\s*/i, '').trim();
      reason = cleanMsg ? `Payment Received (${cleanMsg})` : 'Payment Received';
    } else if (e.type === 'SALE_CREDIT') {
      if (!reason) {
        reason = 'Sale';
      }
    }

    rows.push({
      id: e.id || `row-${Math.random()}`,
      date: e.createdAt || e.date,
      billNo: billNo.toUpperCase(),
      reason,
      drAmount,
      crAmount,
      netChange,
      runningBalance,
      saleBillId: e.saleBillId || undefined,
      paymentReceiptId: e.paymentReceiptId || undefined,
      rawEntries: [e],
    });
  });

  // Return reverse chronological (newest first) for UI display
  return rows.reverse();
}
