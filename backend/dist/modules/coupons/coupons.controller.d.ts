import type { AuthUser } from '../../common/types/auth-user.type';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { IssuePartnerCouponDto } from './dto/issue-partner-coupon.dto';
export declare class CouponsController {
    private readonly couponsService;
    constructor(couponsService: CouponsService);
    create(user: AuthUser, dto: CreateCouponDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        businessPartnerId: string;
        createdById: string;
        code: string;
        expiresAt: Date;
        commissionType: import(".prisma/client").$Enums.DiscountValueType;
        commissionValue: import("@prisma/client/runtime/library").Decimal;
        commissionMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        discountType: import(".prisma/client").$Enums.DiscountValueType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        discountMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        kind: import(".prisma/client").$Enums.CouponKind;
        usageLimit: number;
        usedCount: number;
    }>;
    issuePartnerCoupon(user: AuthUser, dto: IssuePartnerCouponDto): Promise<{
        issuedCount: number;
        coupons: {
            id: string;
            createdAt: Date;
            isActive: boolean;
            businessPartnerId: string;
            createdById: string;
            code: string;
            expiresAt: Date;
            commissionType: import(".prisma/client").$Enums.DiscountValueType;
            commissionValue: import("@prisma/client/runtime/library").Decimal;
            commissionMaxCap: import("@prisma/client/runtime/library").Decimal | null;
            discountType: import(".prisma/client").$Enums.DiscountValueType;
            discountValue: import("@prisma/client/runtime/library").Decimal;
            discountMaxCap: import("@prisma/client/runtime/library").Decimal | null;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
            kind: import(".prisma/client").$Enums.CouponKind;
            usageLimit: number;
            usedCount: number;
        }[];
    }>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        businessPartner: {
            name: string;
            mobile: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        businessPartnerId: string;
        createdById: string;
        code: string;
        expiresAt: Date;
        commissionType: import(".prisma/client").$Enums.DiscountValueType;
        commissionValue: import("@prisma/client/runtime/library").Decimal;
        commissionMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        discountType: import(".prisma/client").$Enums.DiscountValueType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        discountMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        kind: import(".prisma/client").$Enums.CouponKind;
        usageLimit: number;
        usedCount: number;
    })[]>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        businessPartnerId: string;
        createdById: string;
        code: string;
        expiresAt: Date;
        commissionType: import(".prisma/client").$Enums.DiscountValueType;
        commissionValue: import("@prisma/client/runtime/library").Decimal;
        commissionMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        discountType: import(".prisma/client").$Enums.DiscountValueType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        discountMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        kind: import(".prisma/client").$Enums.CouponKind;
        usageLimit: number;
        usedCount: number;
    }[]>;
    listAvailablePromotions(): Promise<{
        remainingUses: number;
        id: string;
        code: string;
        expiresAt: Date;
        discountType: import(".prisma/client").$Enums.DiscountValueType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        discountMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        kind: import(".prisma/client").$Enums.CouponKind;
    }[]>;
    update(id: string, dto: UpdateCouponDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        businessPartnerId: string;
        createdById: string;
        code: string;
        expiresAt: Date;
        commissionType: import(".prisma/client").$Enums.DiscountValueType;
        commissionValue: import("@prisma/client/runtime/library").Decimal;
        commissionMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        discountType: import(".prisma/client").$Enums.DiscountValueType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        discountMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        kind: import(".prisma/client").$Enums.CouponKind;
        usageLimit: number;
        usedCount: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        businessPartnerId: string;
        createdById: string;
        code: string;
        expiresAt: Date;
        commissionType: import(".prisma/client").$Enums.DiscountValueType;
        commissionValue: import("@prisma/client/runtime/library").Decimal;
        commissionMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        discountType: import(".prisma/client").$Enums.DiscountValueType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        discountMaxCap: import("@prisma/client/runtime/library").Decimal | null;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        kind: import(".prisma/client").$Enums.CouponKind;
        usageLimit: number;
        usedCount: number;
    }>;
    getRedemptions(user: AuthUser, id: string): Promise<({
        customer: {
            name: string;
            mobile: string;
            id: string;
        } | null;
    } & {
        id: string;
        customerId: string | null;
        couponId: string;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        orderId: string | null;
        commissionAmount: import("@prisma/client/runtime/library").Decimal;
        creditedAt: Date | null;
        orderAmount: import("@prisma/client/runtime/library").Decimal;
        redeemedAt: Date;
    })[]>;
    redeem(user: AuthUser, code: string, dto: RedeemCouponDto): Promise<{
        discountAmount: number;
        commissionAmount: number;
        redemption: {
            id: string;
            customerId: string | null;
            couponId: string;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            orderId: string | null;
            commissionAmount: import("@prisma/client/runtime/library").Decimal;
            creditedAt: Date | null;
            orderAmount: import("@prisma/client/runtime/library").Decimal;
            redeemedAt: Date;
        };
    }>;
    preview(code: string, amount: string): Promise<{
        discountAmount: number;
        commissionAmount: number;
        finalAmount: number;
    }>;
}
