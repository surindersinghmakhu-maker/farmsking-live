import { Role } from '@prisma/client';
export declare const ADMIN_STAFF_ROLES: readonly Role[];
export declare const FARM_STAFF_ROLES: readonly Role[];
export declare const PARTNER_PORTAL_ROLES: readonly Role[];
export declare const EXPLICIT_CLIENT_ROLES: readonly Role[];
export declare function getActiveRolesList(user: {
    role: Role;
    roles?: Role[] | null;
    deactivatedRoles?: Role[] | null;
}): Role[];
export declare function validateRoleCombination(roles: Role[]): {
    valid: boolean;
    error?: string;
};
export declare function assertRoleCombinationAllowed(roles: Role[]): void;
export declare function pickBestPrimaryRole(roles: Role[]): Role;
export declare function evaluatePortalEligibility(user: {
    role: Role;
    roles?: Role[] | null;
    deactivatedRoles?: Role[] | null;
} | null, portal?: 'CLIENT' | 'PARTNER'): {
    allowed: boolean;
    reason?: string;
};
