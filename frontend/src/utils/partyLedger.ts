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
  rawEntries: any[];
}

export function buildPartyLedgerRows(entries: any[]): GroupedLedgerRow[] {
  if (!entries || entries.length === 0) return [];

  // Sort entries chronologically (oldest first) for accurate running balance calculation
  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
  );

  const cleanReasonForMatching = (reasonStr: string): string => {
    if (!reasonStr) return '';
    let cleaned = reasonStr.toLowerCase();
    cleaned = cleaned.replace(/^amount received against:\s*/i, '');
    cleaned = cleaned.replace(/\s*\([^)]*\)$/gi, '');
    cleaned = cleaned.replace(/\s*\(fk-[a-z0-9]+\)/gi, '');
    return cleaned.trim();
  };

  const extractBillKey = (e: any): string | null => {
    if (e.saleBillId) return `bill_id_${e.saleBillId}`;
    if (e.saleBill?.billNo) return `bill_no_${e.saleBill.billNo.toUpperCase()}`;
    if (e.reason) {
      const match = e.reason.match(/FK-[A-Za-z0-9]+/i);
      if (match) return `bill_no_${match[0].toUpperCase()}`;
      const cleaned = cleanReasonForMatching(e.reason);
      if (cleaned.length > 3) {
        const dateKey = new Date(e.createdAt || e.date).toISOString().slice(0, 13);
        return `reason_${cleaned}_${dateKey}`;
      }
    }
    return null;
  };

  const billGroups = new Map<string, any[]>();
  const standaloneEntries: any[] = [];

  sorted.forEach((e) => {
    const key = extractBillKey(e);
    if (key) {
      const existing = billGroups.get(key) || [];
      billGroups.set(key, [...existing, e]);
    } else {
      standaloneEntries.push(e);
    }
  });

  const timelineEvents: { timestamp: number; key: string; isGroup: boolean; items: any[] }[] = [];

  billGroups.forEach((items, groupKey) => {
    const minTimestamp = Math.min(...items.map((i) => new Date(i.createdAt || i.date).getTime()));
    timelineEvents.push({ timestamp: minTimestamp, key: groupKey, isGroup: true, items });
  });

  standaloneEntries.forEach((e) => {
    timelineEvents.push({
      timestamp: new Date(e.createdAt || e.date).getTime(),
      key: e.id || `st-${Math.random()}`,
      isGroup: false,
      items: [e],
    });
  });

  timelineEvents.sort((a, b) => a.timestamp - b.timestamp);

  let runningBalance = 0;
  const resultRows: GroupedLedgerRow[] = [];

  timelineEvents.forEach((ev) => {
    let drAmount = 0;
    let crAmount = 0;
    let billNo = '—';
    let reason = '';
    let dateStr = '';
    let saleBillId: string | undefined = undefined;

    if (ev.isGroup) {
      const creditEntry = ev.items.find((i) => i.type === 'SALE_CREDIT' || i.type === 'EXPENSE_PAYMENT');
      const paymentEntry = ev.items.find((i) => i.type === 'SALE_PAYMENT' || i.type === 'EXPENSE_CREDIT');
      const firstItem = creditEntry || ev.items[0];

      dateStr = firstItem.createdAt || firstItem.date;
      saleBillId = firstItem.saleBillId || undefined;

      let rawBillNo = firstItem.saleBill?.billNo || (firstItem.reason ? (firstItem.reason.match(/FK-[A-Za-z0-9]+/i)?.[0] || '') : '');
      if (!rawBillNo && firstItem.saleBillId) {
        rawBillNo = `FK-${firstItem.saleBillId.slice(-6).toUpperCase()}`;
      }
      if (!rawBillNo) {
        const dt = new Date(dateStr);
        const yymmdd = `${String(dt.getFullYear()).slice(-2)}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
        const itemHash = (firstItem.id || '101').replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase();
        rawBillNo = `FK-${yymmdd}${itemHash}`;
      }
      billNo = rawBillNo.toUpperCase();

      ev.items.forEach((item) => {
        if (item.type === 'SALE_CREDIT' || item.type === 'EXPENSE_PAYMENT') {
          drAmount += Number(item.amount);
        } else if (item.type === 'SALE_PAYMENT' || item.type === 'EXPENSE_CREDIT') {
          crAmount += Number(item.amount);
        }
      });

      if (creditEntry) {
        reason = creditEntry.reason.replace(/\s*\(FK-[A-Za-z0-9]+\)/gi, '').trim();
      } else if (paymentEntry) {
        reason = paymentEntry.reason.replace(/^amount received against:\s*/i, '').replace(/\s*\(FK-[A-Za-z0-9]+\)/gi, '').trim();
      } else {
        reason = firstItem.reason;
      }
    } else {
      const e = ev.items[0];
      dateStr = e.createdAt || e.date;
      let rawBillNo = e.saleBill?.billNo || (e.reason ? (e.reason.match(/FK-[A-Za-z0-9]+/i)?.[0] || '') : '');
      if (!rawBillNo && e.saleBillId) {
        rawBillNo = `FK-${e.saleBillId.slice(-6).toUpperCase()}`;
      }
      if (!rawBillNo) {
        const dt = new Date(dateStr);
        const yymmdd = `${String(dt.getFullYear()).slice(-2)}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
        const itemHash = (e.id || '101').replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase();
        rawBillNo = `FK-${yymmdd}${itemHash}`;
      }
      billNo = rawBillNo.toUpperCase();
      reason = e.reason;

      if (e.type === 'SALE_CREDIT' || e.type === 'EXPENSE_PAYMENT') {
        drAmount = Number(e.amount);
      } else if (e.type === 'SALE_PAYMENT' || e.type === 'EXPENSE_CREDIT') {
        crAmount = Number(e.amount);
      }
    }

    const netChange = drAmount - crAmount;
    runningBalance += netChange;

    resultRows.push({
      id: ev.key,
      date: dateStr,
      billNo,
      reason,
      drAmount,
      crAmount,
      netChange,
      runningBalance,
      saleBillId,
      rawEntries: ev.items,
    });
  });

  // Return reverse chronological (newest first) for UI display
  return resultRows.reverse();
}
