"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIndianPhone = normalizeIndianPhone;
exports.formatIndianPhoneDisplay = formatIndianPhoneDisplay;
exports.isValidIndianPhone = isValidIndianPhone;
function normalizeIndianPhone(rawPhone) {
    if (!rawPhone)
        return '';
    return String(rawPhone).trim().replace(/\D/g, '').slice(-10);
}
function formatIndianPhoneDisplay(rawPhone) {
    const clean = normalizeIndianPhone(rawPhone);
    if (clean.length !== 10)
        return rawPhone ? String(rawPhone) : '';
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
}
function isValidIndianPhone(rawPhone) {
    const clean = normalizeIndianPhone(rawPhone);
    return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}
//# sourceMappingURL=phone.util.js.map