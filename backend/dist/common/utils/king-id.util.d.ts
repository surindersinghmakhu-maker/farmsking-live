import { PrismaClient } from '@prisma/client';
export declare function generateUniqueKingId(prisma: Pick<PrismaClient, 'user'>): Promise<string>;
