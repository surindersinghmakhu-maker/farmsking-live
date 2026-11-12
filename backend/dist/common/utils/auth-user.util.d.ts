import { Role } from '@prisma/client';
export declare function normalizeRoleAlias<T>(val: T): T;
export declare function hasActiveRole(user: {
    role?: Role;
    roles?: Role[];
    deactivatedRoles?: Role[];
} | null | undefined, role: Role): boolean;
