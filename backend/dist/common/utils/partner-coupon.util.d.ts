import { PrismaClient } from '@prisma/client';
export declare function generatePartnerCouponCode(): string;
export declare function provisionPartnerReferralCoupon(prisma: PrismaClient, businessPartnerId: string, createdById: string): Promise<void>;
