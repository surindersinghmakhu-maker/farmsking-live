import { CouponKind, DiscountValueType } from '@prisma/client';
import { ProductsService } from './modules/products/products.service';
import { CouponsService } from './modules/coupons/coupons.service';

describe('Customer-First Trust & Promotion Safeguards', () => {
  it('getReviews hides customer phone numbers, returns null avgRating when empty, and tags verified buyers', async () => {
    const findReviews = jest.fn();
    const findOrders = jest.fn();
    const prisma: any = {
      productReview: { findMany: findReviews },
      customerOrderItem: { findMany: findOrders },
    };

    const service = new ProductsService(prisma);

    // Case 1: Empty reviews must not fabricate a 5.0 rating
    findReviews.mockResolvedValueOnce([]);
    const empty = await service.getReviews('prod-1');
    expect(empty.total).toBe(0);
    expect(empty.avgRating).toBeNull();
    expect(empty.verifiedBuyerCount).toBe(0);

    // Confirm privacy-safe user projection (no mobile column selected)
    expect(findReviews).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { user: { select: { id: true, name: true } } },
      }),
    );

    // Case 2: Reviews exist; only actual buyers get isVerifiedBuyer=true
    findReviews.mockResolvedValueOnce([
      { id: 'r1', productId: 'prod-1', userId: 'u-buyer', rating: 5, title: 'Genuine', comment: 'Worked well', user: { id: 'u-buyer', name: 'Harpreet' } },
      { id: 'r2', productId: 'prod-1', userId: 'u-guest', rating: 4, title: 'Good', comment: 'Nice packaging', user: { id: 'u-guest', name: 'Aman' } },
    ]);
    findOrders.mockResolvedValueOnce([{ order: { customerId: 'u-buyer' } }]);

    const populated = await service.getReviews('prod-1');
    expect(populated.total).toBe(2);
    expect(populated.avgRating).toBe(4.5);
    expect(populated.verifiedBuyerCount).toBe(1);
    expect(populated.reviews[0].isVerifiedBuyer).toBe(true);
    expect(populated.reviews[1].isVerifiedBuyer).toBe(false);
  });

  it('listAvailablePromotions returns only active non-exhausted GENERIC offers without partner or commission fields', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'c1',
        code: 'HARVEST10',
        kind: CouponKind.GENERIC,
        discountType: DiscountValueType.PERCENTAGE,
        discountValue: 10,
        discountMaxCap: 250,
        minOrderAmount: 500,
        expiresAt: new Date(Date.now() + 86_400_000),
        usageLimit: 100,
        usedCount: 25,
      },
      {
        id: 'c2',
        code: 'EXHAUSTED',
        kind: CouponKind.GENERIC,
        discountType: DiscountValueType.FIXED,
        discountValue: 50,
        discountMaxCap: null,
        minOrderAmount: 300,
        expiresAt: new Date(Date.now() + 86_400_000),
        usageLimit: 10,
        usedCount: 10,
      },
    ]);

    const prisma: any = { coupon: { findMany } };
    const service = new CouponsService(prisma, {} as any);

    const promos = await service.listAvailablePromotions();
    expect(promos).toHaveLength(1);
    expect(promos[0].code).toBe('HARVEST10');
    expect(promos[0].remainingUses).toBe(75);
    expect((promos[0] as any).commissionValue).toBeUndefined();
    expect((promos[0] as any).businessPartnerId).toBeUndefined();
  });
});

