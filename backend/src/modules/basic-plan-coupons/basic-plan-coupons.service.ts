import { randomBytes } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FarmerSubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateBasicPlanCouponDto } from './dto/create-basic-plan-coupon.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const PRICE_PER_DAY = 2;
/** Business Partners buy a Basic Plan coupon at 90% of its list price (10% discount). */
const PARTNER_RATE = 0.9;

function generateCode(): string {
  return `BASIC-${randomBytes(3).toString('hex').toUpperCase()}`;
}

const LIST_SELECT = {
  createdBy: { select: { id: true, name: true, kingId: true } },
  purchasedBy: { select: { id: true, name: true, kingId: true } },
  usedByFarmer: { select: { id: true, name: true, kingId: true } },
};

@Injectable()
export class BasicPlanCouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  /** Admin/Super Admin — generates a coupon at the flat ₹2/day list price. */
  async create(admin: AuthUser, dto: CreateBasicPlanCouponDto) {
    let code = generateCode();
    while (await this.prisma.basicPlanCoupon.findUnique({ where: { code } })) {
      code = generateCode();
    }
    return this.prisma.basicPlanCoupon.create({
      data: {
        code,
        daysGranted: dto.daysGranted,
        listPrice: dto.daysGranted * PRICE_PER_DAY,
        createdById: admin.id,
      },
    });
  }

  listAll() {
    return this.prisma.basicPlanCoupon.findMany({
      include: LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Business Partner — coupons nobody has bought yet. */
  listAvailableForPurchase() {
    return this.prisma.basicPlanCoupon.findMany({
      where: { purchasedById: null, isUsed: false },
      include: LIST_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Business Partner — coupons they've already bought (to hand the code to a farmer). */
  listMinePurchased(partner: AuthUser) {
    return this.prisma.basicPlanCoupon.findMany({
      where: { purchasedById: partner.id },
      include: LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Business Partner buys an unpurchased coupon at 90% of list price, debited from their wallet. */
  async purchase(partner: AuthUser, code: string) {
    const coupon = await this.prisma.basicPlanCoupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) {
      throw new NotFoundException('Invalid coupon code.');
    }
    if (coupon.isUsed) {
      throw new BadRequestException('This coupon has already been used.');
    }
    if (coupon.purchasedById) {
      throw new BadRequestException('This coupon has already been purchased by another partner.');
    }

    const price = Number(coupon.listPrice) * PARTNER_RATE;
    const balance = await this.walletService.getBalance(partner.id);
    if (balance < price) {
      throw new BadRequestException('Insufficient wallet balance to purchase this coupon.');
    }

    await this.walletService.debit(partner.id, price, `Purchased Basic Plan coupon ${coupon.code} (${coupon.daysGranted} days)`);

    return this.prisma.basicPlanCoupon.update({
      where: { id: coupon.id },
      data: { purchasedById: partner.id, purchasePrice: price, purchasedAt: new Date() },
      include: LIST_SELECT,
    });
  }

  /** Farmer redeems the code for BASIC-plan days — pending time carries over, same as other plan coupons. */
  async redeem(farmer: AuthUser, code: string) {
    const coupon = await this.prisma.basicPlanCoupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) {
      throw new NotFoundException('Invalid coupon code.');
    }
    if (coupon.isUsed) {
      throw new BadRequestException('This coupon has already been used.');
    }

    const now = new Date();
    const existingPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId: farmer.id } });
    const isPending = !!existingPlan?.endDate && existingPlan.endDate.getTime() > now.getTime();
    const baseDate = isPending ? existingPlan!.endDate! : now;
    const newEndDate = new Date(baseDate.getTime() + coupon.daysGranted * DAY_MS);

    const [plan] = await this.prisma.$transaction([
      this.prisma.farmerPlan.upsert({
        where: { farmerId: farmer.id },
        create: { farmerId: farmer.id, plan: FarmerSubscriptionPlan.BASIC, endDate: newEndDate },
        update: { plan: FarmerSubscriptionPlan.BASIC, endDate: newEndDate, expiredAt: null },
      }),
      this.prisma.basicPlanCoupon.update({
        where: { id: coupon.id },
        data: { isUsed: true, usedAt: now, usedByFarmerId: farmer.id },
      }),
    ]);

    return { plan, daysAdded: coupon.daysGranted, newEndDate };
  }
}
