import { PrismaClient } from '@prisma/client';
export declare function provisionReferralWelcomeCoupon(prisma: PrismaClient, customerId: string, referrerId: string): Promise<string | null>;
