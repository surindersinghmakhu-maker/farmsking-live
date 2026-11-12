/**
 * Centralized Indian Statutory Tax, KYC Format & Payment Compliance Helpers
 * (CGST Act 2017 Sec 52 TCS @ 0.5%, Income Tax Act 1961 Sec 194-O/194-H/194-J/206AA TDS)
 */

/** Statutory GST Section 52 TCS rate (reduced from 1% to 0.5% w.e.f. 10-Jul-2024: 0.25% CGST + 0.25% SGST / 0.5% IGST) */
export const ECOMMERCE_TCS_RATE_PERCENT = 0.5;
export const ECOMMERCE_TCS_RATE = 0.005;

/** Platform marketplace commission GST rate (SAC 998599 / 998314 @ 18%) */
export const COMMISSION_GST_RATE_PERCENT = 18.0;

/** Income Tax TDS statutory rates (%) */
export const TDS_RATES = {
  SEC_194O_WITH_PAN: 0.1, // w.e.f. 01-Oct-2024 reduced from 1% to 0.1% for E-Commerce participants
  SEC_194O_NO_PAN_206AA: 5.0, // Sec 206AA higher rate if PAN not furnished under 194-O
  SEC_194H_WITH_PAN: 2.0, // w.e.f. 01-Oct-2024 reduced from 5% to 2% for Commission / Brokerage (Agents)
  SEC_194H_NO_PAN_206AA: 20.0,
  SEC_194J_WITH_PAN: 10.0, // Professional / Technical Fees (Advisors, Trainers, Consultants)
  SEC_194J_NO_PAN_206AA: 20.0,
} as const;

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const FSSAI_REGEX = /^\d{14}$/;
export const AADHAAR_LAST4_REGEX = /^\d{4}$/;

export const PLACEHOLDER_TAX_IDS = new Set([
  '03AAAAF0000A1Z5',
  '03ABCDE1234F1Z5',
  '03AAAAA0000A1Z5',
  'AAAAF0000A',
  'AABCF1234D',
  'PTLA12345B',
  'U01100PB2026PTC000000',
  '10023064000123',
]);

export function isRealStatutoryId(val?: string | null): boolean {
  const clean = String(val || '').trim().toUpperCase();
  if (!clean) return false;
  return !PLACEHOLDER_TAX_IDS.has(clean);
}

export function isValidGstin(val?: string | null): boolean {
  const clean = String(val || '').trim().toUpperCase();
  return GSTIN_REGEX.test(clean) && !PLACEHOLDER_TAX_IDS.has(clean);
}

export function isValidPan(val?: string | null): boolean {
  const clean = String(val || '').trim().toUpperCase();
  return PAN_REGEX.test(clean) && !PLACEHOLDER_TAX_IDS.has(clean);
}

export function maskPan(val?: string | null): string | null {
  const clean = String(val || '').trim().toUpperCase();
  if (clean.length !== 10) return null;
  return `${clean.slice(0, 2)}XXXXX${clean.slice(7)}`;
}

/** Determine whether transaction is inter-state based on seller pickup state vs buyer/delivery state/address. */
export function detectInterStateSupply(
  sellerState?: string | null,
  buyerStateOrAddress?: string | null,
): boolean {
  const s = String(sellerState || '').trim().toLowerCase();
  const b = String(buyerStateOrAddress || '').trim().toLowerCase();
  if (!s || !b) return false;
  if (b === s || b.includes(s)) return false;
  return true;
}

export function getCurrentFinancialYearAndQuarter(date = new Date()): {
  financialYear: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
} {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYr = month >= 4 ? year : year - 1;
  const financialYear = `FY${String(startYr).slice(-2)}-${String(startYr + 1).slice(-2)}`;
  const quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' =
    month >= 4 && month <= 6
      ? 'Q1'
      : month >= 7 && month <= 9
        ? 'Q2'
        : month >= 10 && month <= 12
          ? 'Q3'
          : 'Q4';
  return { financialYear, quarter };
}

export type TdsSectionType = '194O' | '194H' | '194J';

/** Computes statutory TDS deduction using live PAN availability and Income Tax Sec 206AA fallback. */
export function computeTdsDeduction(params: {
  grossAmount: number;
  section: TdsSectionType;
  panNumber?: string | null;
}): {
  grossAmount: number;
  tdsRate: number;
  tdsAmount: number;
  netAmount: number;
  effectiveSection: string;
  panAvailable: boolean;
} {
  const gross = Number(Math.max(0, Number(params.grossAmount) || 0).toFixed(2));
  const panOk = isValidPan(params.panNumber);

  let rate = 0;
  let effectiveSection: string = params.section;

  if (params.section === '194O') {
    rate = panOk ? TDS_RATES.SEC_194O_WITH_PAN : TDS_RATES.SEC_194O_NO_PAN_206AA;
    if (!panOk) effectiveSection = '194O/206AA';
  } else if (params.section === '194H') {
    rate = panOk ? TDS_RATES.SEC_194H_WITH_PAN : TDS_RATES.SEC_194H_NO_PAN_206AA;
    if (!panOk) effectiveSection = '194H/206AA';
  } else {
    rate = panOk ? TDS_RATES.SEC_194J_WITH_PAN : TDS_RATES.SEC_194J_NO_PAN_206AA;
    if (!panOk) effectiveSection = '194J/206AA';
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

/** Computes consistent E-Commerce order item settlement breakdown (0.5% TCS on taxable value + 18% GST on commission + 194-O TDS preview). */
export function computeMarketplaceSettlement(params: {
  grossAmount: number;
  gstPercentage: number;
  commissionPercent: number;
  isSellerGstRegistered: boolean;
  sellerPanNumber?: string | null;
  includeTds194O?: boolean;
}): {
  netTaxableAmount: number;
  productGstAmount: number;
  tcsRate: number;
  tcsAmount: number;
  commissionAmount: number;
  commissionGstAmount: number;
  tds194OAmount: number;
  netSellerPayout: number;
} {
  const gross = Number(Math.max(0, params.grossAmount).toFixed(2));
  const gstPct = Math.max(0, Number(params.gstPercentage || 0));
  const commPct = Math.max(0, Number(params.commissionPercent || 8));

  const netTaxableAmount =
    gstPct > 0 ? Number((gross / (1 + gstPct / 100)).toFixed(2)) : gross;
  const productGstAmount = Number((gross - netTaxableAmount).toFixed(2));

  // CGST Sec 52 TCS: 0.5% strictly on net taxable value for GST-registered sellers
  const tcsRate = params.isSellerGstRegistered ? ECOMMERCE_TCS_RATE_PERCENT : 0;
  const tcsAmount = params.isSellerGstRegistered
    ? Number((netTaxableAmount * ECOMMERCE_TCS_RATE).toFixed(2))
    : 0;

  const commissionAmount = Number(((netTaxableAmount * commPct) / 100).toFixed(2));
  const commissionGstAmount = Number(((commissionAmount * COMMISSION_GST_RATE_PERCENT) / 100).toFixed(2));

  let tds194OAmount = 0;
  if (params.includeTds194O) {
    const tds = computeTdsDeduction({
      grossAmount: netTaxableAmount,
      section: '194O',
      panNumber: params.sellerPanNumber,
    });
    tds194OAmount = tds.tdsAmount;
  }

  const netSellerPayout = Number(
    Math.max(0, gross - commissionAmount - commissionGstAmount - tcsAmount - tds194OAmount).toFixed(2),
  );

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

