/**
 * 👑 FarmsKing Phone Utility Functions
 * Standardizes 10-digit Indian Mobile Numbers across platforms
 */
export function normalizeIndianPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '';
  return String(rawPhone).trim().replace(/\D/g, '').slice(-10);
}

export function formatIndianPhoneDisplay(rawPhone: string | null | undefined): string {
  const clean = normalizeIndianPhone(rawPhone);
  if (clean.length !== 10) return rawPhone ? String(rawPhone) : '';
  return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
}

export function isValidIndianPhone(rawPhone: string | null | undefined): boolean {
  const clean = normalizeIndianPhone(rawPhone);
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}
