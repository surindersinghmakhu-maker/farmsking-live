"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUpiPaymentLink = buildUpiPaymentLink;
function buildUpiPaymentLink(params) {
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
//# sourceMappingURL=upi.util.js.map