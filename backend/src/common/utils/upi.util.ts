/** Builds a `upi://pay` deep link with a fixed amount and a transaction note (remark), per the UPI Linking Specification. */
export function buildUpiPaymentLink(params: {
  amount: number;
  note: string;
  transactionRef?: string;
  payeeVpa: string;
  payeeName?: string;
}): string {
  const query = new URLSearchParams({
    pa: params.payeeVpa,
    pn: params.payeeName ?? 'FarmsKing',
    am: params.amount.toFixed(2),
    cu: 'INR',
    tn: params.note,
  });
  if (params.transactionRef) {
    query.set('tr', params.transactionRef);
  }

  return `upi://pay?${query.toString()}`;
}
