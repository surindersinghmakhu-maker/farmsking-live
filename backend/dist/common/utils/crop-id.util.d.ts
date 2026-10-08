import { PrismaClient } from '@prisma/client';
export declare function generateUniqueCropId(prisma: Pick<PrismaClient, 'cropCycle'>): Promise<string>;
