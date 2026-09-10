export interface GroupedLedgerRow {
  id: string;
  srNo: number;
  entryNo: string;
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

export function cleanParticulars(reason: string, drAmount: number = 0, crAmount: number = 0): string {
  if (!reason) {
    if (drAmount > 0) return 'Sale';
    if (crAmount > 0) return 'Receipt';
    return 'Payment';
  }

  const text = reason.trim();
  const isUpi = /upi|online/i.test(text);

  // Handle Receipt / Payment Received (Credit amount or Payment In)
  if (
    /received|receipt|\brct\b|payment in/i.test(text) ||
    crAmount > 0
  ) {
    if (isUpi) return 'Receipt (UPI)';
    if (/cash/i.test(text)) return 'Receipt (Cash)';
    return 'Receipt';
  }

  // Handle Payment Out / Payment Made
  if (
    /payment made|\bpay out\b|\bpaid\b/i.test(text) ||
    (/^payment/i.test(text) && !/received/i.test(text))
  ) {
    if (isUpi) return 'Payment (UPI)';
    if (/cash/i.test(text)) return 'Payment (Cash)';
    return 'Payment';
  }

  // Handle Sale
  if (/^sale/i.test(text) || drAmount > 0) {
    return 'Sale';
  }

  // Default fallback
  if (isUpi) return 'Payment (UPI)';
  if (/cash/i.test(text)) return 'Payment (Cash)';
  return drAmount > 0 ? 'Sale' : 'Payment';
}

function extractRefNo(e: any): string {
  if (e.saleBill?.billNo) return e.saleBill.billNo.trim().toUpperCase();
  if (e.paymentReceipt?.receiptNo) return e.paymentReceipt.receiptNo.trim().toUpperCase();
  if (e.referenceNo && String(e.referenceNo).trim()) return String(e.referenceNo).trim().toUpperCase();
  if (e.billNo && String(e.billNo).trim()) return String(e.billNo).trim().toUpperCase();
  if (e.reason) {
    const match = e.reason.match(/FK-[A-Za-z0-9]+/i);
    if (match) return match[0].toUpperCase();
    const rctMatch = e.reason.match(/RCT-[A-Za-z0-9]+/i);
    if (rctMatch) return rctMatch[0].toUpperCase();
  }
  return '';
}

export function buildPartyLedgerRows(entries: any[]): GroupedLedgerRow[] {
  if (!entries || entries.length === 0) return [];

  // Sort entries chronologically (oldest first) for accurate running balance & sequential Sr No.
  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
  );

  // Group entries by reference/bill number, saleBillId, or paymentReceiptId
  const groupedMap = new Map<string, any[]>();
  const groupOrder: string[] = [];

  sorted.forEach((e) => {
    const refNo = extractRefNo(e);
    let key = '';

    if (refNo && refNo !== '—') {
      key = `ref_${refNo}`;
    } else if (e.saleBillId) {
      key = `sb_${e.saleBillId}`;
    } else if (e.paymentReceiptId) {
      key = `pr_${e.paymentReceiptId}`;
    } else {
      key = `single_${e.id || Math.random()}`;
    }

    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
      groupOrder.push(key);
    }
    groupedMap.get(key)!.push(e);
  });

  let runningBalance = 0;
  const rows: GroupedLedgerRow[] = [];

  groupOrder.forEach((key, idx) => {
    const group = groupedMap.get(key)!;
    const srNo = idx + 1;
    const entryNo = `#${srNo}`;

    let drAmount = 0;
    let crAmount = 0;
    let mainReason = '';
    let billNo = '';
    let saleBillId = undefined;
    let paymentReceiptId = undefined;
    const date = group[0].createdAt || group[0].date;

    group.forEach((e) => {
      if (e.type === 'SALE_CREDIT' || e.type === 'EXPENSE_PAYMENT') {
        drAmount += Number(e.amount) || 0;
        if (!mainReason || e.type === 'SALE_CREDIT') {
          mainReason = e.reason || '';
        }
      } else if (e.type === 'SALE_PAYMENT' || e.type === 'EXPENSE_CREDIT') {
        crAmount += Number(e.amount) || 0;
        if (!mainReason) {
          mainReason = e.reason || '';
        }
      } else {
        const amt = Number(e.amount) || 0;
        if (e.drAmount) drAmount += Number(e.drAmount);
        else if (e.crAmount) crAmount += Number(e.crAmount);
        else if (amt > 0) drAmount += amt;
      }

      if (e.saleBillId) saleBillId = e.saleBillId;
      if (e.paymentReceiptId) paymentReceiptId = e.paymentReceiptId;

      if (!billNo) {
        billNo = extractRefNo(e);
      }
    });

    if (!billNo) billNo = '—';

    const netChange = drAmount - crAmount;
    runningBalance += netChange;

    const reason = cleanParticulars(mainReason || group[0].reason || '', drAmount, crAmount);

    rows.push({
      id: saleBillId || paymentReceiptId || group[0].id || `row-${Math.random()}`,
      srNo,
      entryNo,
      date,
      billNo: billNo.toUpperCase(),
      reason,
      drAmount,
      crAmount,
      netChange,
      runningBalance,
      saleBillId,
      paymentReceiptId,
      rawEntries: group,
    });
  });

  // Return reverse chronological (newest first) for UI display
  return rows.reverse();
}
