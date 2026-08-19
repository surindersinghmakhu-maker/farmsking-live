import { randomBytes } from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponKind, CouponSystemSetting, DiscountValueType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { IssuePartnerCouponDto } from './dto/issue-partner-coupon.dto';
import { generatePartnerCouponCode } from '../../common/utils/partner-coupon.util';

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids look-alike mixups when read aloud/shared

/** 'C' + 5-character alphanumeric code — the default format for Commission-Based (GENERIC) coupons. */
function generateCouponCode(): string {
  const bytes = randomBytes(5);
  let code = 'C';
  for (let i = 0; i < 5; i++) {
    code += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return code;
}

function applyDiscountValue(type: DiscountValueType, value: number, base: number, maxCap?: number | null): number {
  const raw = type === 'PERCENTAGE' ? (base * value) / 100 : value;
  const capped = maxCap != null ? Math.min(raw, maxCap) : raw;
  return Math.min(capped, base);
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async create(user: AuthUser, dto: CreateCouponDto) {
    const partner = await this.prisma.user.findFirst({
      where: { id: dto.businessPartnerId, roles: { hasSome: [Role.BUSINESS_PARTNER, Role.ADVISOR] }, deletedAt: null },
    });
    if (!partner) {
      throw new NotFoundException('Business partner or advisor not found.');
    }

    let code: string;
    if (dto.code) {
      code = dto.code.trim().toUpperCase();
      if (await this.prisma.coupon.findUnique({ where: { code } })) {
        throw new ConflictException('That coupon code is already in use.');
      }
    } else {
      code = generateCouponCode();
      while (await this.prisma.coupon.findUnique({ where: { code } })) {
        code = generateCouponCode();
      }
    }

    return this.prisma.coupon.create({
      data: {
        code,
        businessPartnerId: dto.businessPartnerId,
        kind: dto.kind ?? CouponKind.GENERIC,
        commissionType: dto.commissionType,
        commissionValue: dto.commissionValue,
        commissionMaxCap: dto.commissionMaxCap,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        discountMaxCap: dto.discountMaxCap,
        minOrderAmount: dto.minOrderAmount,
        expiresAt: new Date(dto.expiresAt),
        usageLimit: dto.usageLimit,
        createdById: user.id,
      },
    });
  }

  listAll() {
    return this.prisma.coupon.findMany({
      include: { businessPartner: { select: { id: true, name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listMine(user: AuthUser) {
    return this.prisma.coupon.findMany({
      where: { businessPartnerId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOneOrThrow(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOneOrThrow(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.expiresAt ? { expiresAt: new Date(dto.expiresAt) } : {}),
      },
    });
  }

  /** "Remove" — deactivates rather than hard-deleting so past redemptions stay intact. */
  async remove(id: string) {
    await this.findOneOrThrow(id);
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }

  async getRedemptions(user: AuthUser, id: string) {
    const coupon = await this.findOneOrThrow(id);
    if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && coupon.businessPartnerId !== user.id) {
      throw new ForbiddenException('You do not have access to this coupon.');
    }
    return this.prisma.couponRedemption.findMany({
      where: { couponId: id },
      include: { customer: { select: { id: true, name: true, mobile: true } } },
      orderBy: { redeemedAt: 'desc' },
    });
  }

  /** Validates a coupon code against an order amount and computes the (capped) discount/commission. Shared by checkout and manual redemption. */
  async getActiveForOrder(code: string, orderAmount: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Invalid or inactive coupon code.');
    }
    if (coupon.expiresAt < new Date()) {
      throw new BadRequestException('This coupon has expired.');
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new ConflictException('This coupon has reached its usage limit.');
    }
    if (coupon.minOrderAmount != null && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`This coupon needs a minimum order of ₹${coupon.minOrderAmount}.`);
    }

    const discountAmount = applyDiscountValue(
      coupon.discountType,
      Number(coupon.discountValue),
      orderAmount,
      coupon.discountMaxCap != null ? Number(coupon.discountMaxCap) : null,
    );
    const commissionAmount = applyDiscountValue(
      coupon.commissionType,
      Number(coupon.commissionValue),
      orderAmount,
      coupon.commissionMaxCap != null ? Number(coupon.commissionMaxCap) : null,
    );

    return { coupon, discountAmount, commissionAmount };
  }

  /** Preview-only variant for the cart's "Apply coupon" step — does not touch usage counters or the database. */
  async previewForOrder(code: string, orderAmount: number) {
    const { discountAmount, commissionAmount } = await this.getActiveForOrder(code, orderAmount);
    return { discountAmount, commissionAmount, finalAmount: orderAmount - discountAmount };
  }

  /** Applies a coupon to an order: records the redemption, credits the partner's wallet with commission. */
  async redeem(user: AuthUser, code: string, dto: RedeemCouponDto) {
    const { coupon, discountAmount, commissionAmount } = await this.getActiveForOrder(code, dto.orderAmount);

    const [redemption] = await this.prisma.$transaction([
      this.prisma.couponRedemption.create({
        data: {
          couponId: coupon.id,
          customerId: user.id,
          orderAmount: dto.orderAmount,
          discountAmount,
          commissionAmount,
        },
      }),
      this.prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } }),
    ]);

    await this.walletService.credit(
      coupon.businessPartnerId,
      commissionAmount,
      `Commission from coupon ${coupon.code}`,
      { couponRedemptionId: redemption.id },
    );

    if (user.role === Role.CUSTOMER) {
      const partner = await this.prisma.user.findFirst({
        where: { id: coupon.businessPartnerId, roles: { has: Role.BUSINESS_PARTNER }, deletedAt: null },
      });
      if (partner) {
        await this.prisma.partnerAssignment.upsert({
          where: { customerId: user.id },
          create: { businessPartnerId: partner.id, customerId: user.id },
          update: {},
        });
      }
    }

    return { discountAmount, commissionAmount, redemption };
  }

  /** Builds one Business-Partner-tier referral coupon (10%/5%/₹500 min/₹100 cap by default, all Super-Admin configurable) for the given partner, using current AppSetting values. Always creates a new coupon — unlike the automatic on-role-grant issuance, this never skips for an existing one. */
  private async issueOnePartnerCoupon(businessPartnerId: string, createdById: string, settingsIn?: CouponSystemSetting) {
    const settings =
      settingsIn ??
      (await this.prisma.couponSystemSetting.upsert({
        where: { id: 'default' },
        update: {},
        create: { id: 'default' },
      }));

    let code = generatePartnerCouponCode();
    while (await this.prisma.coupon.findUnique({ where: { code } })) {
      code = generatePartnerCouponCode();
    }

    return this.prisma.coupon.create({
      data: {
        code,
        businessPartnerId,
        createdById,
        kind: CouponKind.PARTNER_REFERRAL,
        commissionType: DiscountValueType.PERCENTAGE,
        commissionValue: settings.partnerCouponCommissionPercent,
        discountType: DiscountValueType.PERCENTAGE,
        discountValue: settings.partnerCouponDiscountPercent,
        discountMaxCap: settings.partnerCouponMaxDiscountCap,
        minOrderAmount: settings.partnerCouponMinOrderAmount,
        expiresAt: new Date(Date.now() + settings.partnerCouponValidityDays * 24 * 60 * 60 * 1000),
        usageLimit: 100000,
      },
    });
  }

  /** Super Admin action: issue a fresh Business-Partner-tier referral coupon to one selected partner, or to every active Business Partner at once. */
  async issuePartnerCoupon(caller: AuthUser, dto: IssuePartnerCouponDto) {
    if (dto.businessPartnerId) {
      const partner = await this.prisma.user.findFirst({
        where: { id: dto.businessPartnerId, roles: { has: Role.BUSINESS_PARTNER }, deletedAt: null },
      });
      if (!partner) {
        throw new NotFoundException('Business partner not found.');
      }
      const coupon = await this.issueOnePartnerCoupon(dto.businessPartnerId, caller.id);
      return { issuedCount: 1, coupons: [coupon] };
    }

    const [partners, settings] = await Promise.all([
      this.prisma.user.findMany({
        where: { roles: { has: Role.BUSINESS_PARTNER }, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.couponSystemSetting.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default' } }),
    ]);
    const coupons = await Promise.all(partners.map((partner) => this.issueOnePartnerCoupon(partner.id, caller.id, settings)));
    return { issuedCount: coupons.length, coupons };
  }
}
