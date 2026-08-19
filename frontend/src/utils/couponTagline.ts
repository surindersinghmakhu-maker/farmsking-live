import { Coupon } from '../types/api';

/** e.g. "10% OFF" for a percentage coupon, "₹100 OFF" for a fixed one — the big headline text. */
export function couponHeadline(coupon: Pick<Coupon, 'discountType' | 'discountValue'>): string {
  return coupon.discountType === 'PERCENTAGE' ? `${Number(coupon.discountValue)}% OFF` : `₹${Number(coupon.discountValue)} OFF`;
}

/** e.g. "upto ₹100" when capped, or "on orders above ₹500" when there's a minimum order but no cap. */
export function couponSubline(coupon: Pick<Coupon, 'discountMaxCap' | 'minOrderAmount'>): string {
  if (coupon.discountMaxCap) return `upto ₹${Number(coupon.discountMaxCap)}`;
  if (coupon.minOrderAmount) return `on orders above ₹${Number(coupon.minOrderAmount)}`;
  return '';
}

/** One-line tagline for lists/previews, e.g. "10% discount upto ₹100". */
export function couponTagline(coupon: Pick<Coupon, 'discountType' | 'discountValue' | 'discountMaxCap' | 'minOrderAmount'>): string {
  const base = coupon.discountType === 'PERCENTAGE' ? `${Number(coupon.discountValue)}% discount` : `₹${Number(coupon.discountValue)} discount`;
  const sub = couponSubline(coupon);
  return sub ? `${base} ${sub}` : base;
}
