"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLACEHOLDER_TAX_IDS = exports.AADHAAR_LAST4_REGEX = exports.FSSAI_REGEX = exports.IFSC_REGEX = exports.PAN_REGEX = exports.GSTIN_REGEX = exports.TDS_RATES = exports.COMMISSION_GST_RATE_PERCENT = exports.ECOMMERCE_TCS_RATE = exports.ECOMMERCE_TCS_RATE_PERCENT = void 0;
exports.isRealStatutoryId = isRealStatutoryId;
exports.isValidGstin = isValidGstin;
exports.isValidPan = isValidPan;
exports.maskPan = maskPan;
exports.detectInterStateSupply = detectInterStateSupply;
exports.getCurrentFinancialYearAndQuarter = getCurrentFinancialYearAndQuarter;
exports.computeTdsDeduction = computeTdsDeduction;
exports.computeMarketplaceSettlement = computeMarketplaceSettlement;
exports.ECOMMERCE_TCS_RATE_PERCENT = 0.5;
exports.ECOMMERCE_TCS_RATE = 0.005;
exports.COMMISSION_GST_RATE_PERCENT = 18.0;
exports.TDS_RATES = {
    SEC_194O_WITH_PAN: 0.1,
    SEC_194O_NO_PAN_206AA: 5.0,
    SEC_194H_WITH_PAN: 2.0,
    SEC_194H_NO_PAN_206AA: 20.0,
    SEC_194J_WITH_PAN: 10.0,
    SEC_194J_NO_PAN_206AA: 20.0,
};
exports.GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
exports.PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
exports.IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
exports.FSSAI_REGEX = /^\d{14}$/;
exports.AADHAAR_LAST4_REGEX = /^\d{4}$/;
exports.PLACEHOLDER_TAX_IDS = new Set([
    '03AAAAF0000A1Z5',
    '03ABCDE1234F1Z5',
    '03AAAAA0000A1Z5',
    'AAAAF0000A',
    'AABCF1234D',
    'PTLA12345B',
    'U01100PB2026PTC000000',
    '10023064000123',
]);
function isRealStatutoryId(val) {
    const clean = String(val || '').trim().toUpperCase();
    if (!clean)
        return false;
    return !exports.PLACEHOLDER_TAX_IDS.has(clean);
}
function isValidGstin(val) {
    const clean = String(val || '').trim().toUpperCase();
    return exports.GSTIN_REGEX.test(clean) && !exports.PLACEHOLDER_TAX_IDS.has(clean);
}
function isValidPan(val) {
    const clean = String(val || '').trim().toUpperCase();
    return exports.PAN_REGEX.test(clean) && !exports.PLACEHOLDER_TAX_IDS.has(clean);
}
function maskPan(val) {
    const clean = String(val || '').trim().toUpperCase();
    if (clean.length !== 10)
        return null;
    return `${clean.slice(0, 2)}XXXXX${clean.slice(7)}`;
}
function detectInterStateSupply(sellerState, buyerStateOrAddress) {
    const s = String(sellerState || '').trim().toLowerCase();
    const b = String(buyerStateOrAddress || '').trim().toLowerCase();
    if (!s || !b)
        return false;
    if (b === s || b.includes(s))
        return false;
    return true;
}
function getCurrentFinancialYearAndQuarter(date = new Date()) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const startYr = month >= 4 ? year : year - 1;
    const financialYear = `FY${String(startYr).slice(-2)}-${String(startYr + 1).slice(-2)}`;
    const quarter = month >= 4 && month <= 6
        ? 'Q1'
        : month >= 7 && month <= 9
            ? 'Q2'
            : month >= 10 && month <= 12
                ? 'Q3'
                : 'Q4';
    return { financialYear, quarter };
}
function computeTdsDeduction(params) {
    const gross = Number(Math.max(0, Number(params.grossAmount) || 0).toFixed(2));
    const panOk = isValidPan(params.panNumber);
    let rate = 0;
    let effectiveSection = params.section;
    if (params.section === '194O') {
        rate = panOk ? exports.TDS_RATES.SEC_194O_WITH_PAN : exports.TDS_RATES.SEC_194O_NO_PAN_206AA;
        if (!panOk)
            effectiveSection = '194O/206AA';
    }
    else if (params.section === '194H') {
        rate = panOk ? exports.TDS_RATES.SEC_194H_WITH_PAN : exports.TDS_RATES.SEC_194H_NO_PAN_206AA;
        if (!panOk)
            effectiveSection = '194H/206AA';
    }
    else {
        rate = panOk ? exports.TDS_RATES.SEC_194J_WITH_PAN : exports.TDS_RATES.SEC_194J_NO_PAN_206AA;
        if (!panOk)
            effectiveSection = '194J/206AA';
    }
    const tdsAmount = Number(((gross * rate) / 100).toFixed(2));
    const netAmount = Number(Math.max(0, gross - tdsAmount).toFixed(2));
    return {
        grossAmount: gross,
        tdsRate: rate,
        tdsAmount,
        netAmount,
        effectiveSection,
        panAvailable: panOk,
    };
}
function computeMarketplaceSettlement(params) {
    const gross = Number(Math.max(0, params.grossAmount).toFixed(2));
    const gstPct = Math.max(0, Number(params.gstPercentage || 0));
    const commPct = Math.max(0, Number(params.commissionPercent || 8));
    const netTaxableAmount = gstPct > 0 ? Number((gross / (1 + gstPct / 100)).toFixed(2)) : gross;
    const productGstAmount = Number((gross - netTaxableAmount).toFixed(2));
    const tcsRate = params.isSellerGstRegistered ? exports.ECOMMERCE_TCS_RATE_PERCENT : 0;
    const tcsAmount = params.isSellerGstRegistered
        ? Number((netTaxableAmount * exports.ECOMMERCE_TCS_RATE).toFixed(2))
        : 0;
    const commissionAmount = Number(((netTaxableAmount * commPct) / 100).toFixed(2));
    const commissionGstAmount = Number(((commissionAmount * exports.COMMISSION_GST_RATE_PERCENT) / 100).toFixed(2));
    let tds194OAmount = 0;
    if (params.includeTds194O) {
        const tds = computeTdsDeduction({
            grossAmount: netTaxableAmount,
            section: '194O',
            panNumber: params.sellerPanNumber,
        });
        tds194OAmount = tds.tdsAmount;
    }
    const netSellerPayout = Number(Math.max(0, gross - commissionAmount - commissionGstAmount - tcsAmount - tds194OAmount).toFixed(2));
    return {
        netTaxableAmount,
        productGstAmount,
        tcsRate,
        tcsAmount,
        commissionAmount,
        commissionGstAmount,
        tds194OAmount,
        netSellerPayout,
    };
}
//# sourceMappingURL=tax-compliance.util.js.map