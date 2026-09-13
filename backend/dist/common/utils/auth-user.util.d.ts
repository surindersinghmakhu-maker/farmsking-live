import { Role } from '@prisma/client';
export declare function hasActiveRole(user: {
    role: Role;
    roles: Role[];
    deactivatedRoles: Role[];
}, role: Role): boolean;
