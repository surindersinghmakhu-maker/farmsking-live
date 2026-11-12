import type { PrismaService } from '../../modules/prisma/prisma.service';
import type { AuthUser } from '../types/auth-user.type';
export type SupervisorFeatureCategory = 'spray' | 'labour' | 'advisory' | 'sales';
export type SupervisorFeatureMode = 'view' | 'entry';
export declare function assertSupervisorPermission(prisma: PrismaService, user: AuthUser, category: SupervisorFeatureCategory, mode: SupervisorFeatureMode): Promise<void>;
