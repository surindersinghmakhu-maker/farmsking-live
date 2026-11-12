import { Role } from '@prisma/client';
export declare const ASSIGNABLE_CHECKBOX_ROLES: readonly ["CUSTOMER", "FARMER", "GARDENER", "SUPERVISOR", "LABOUR", "AGENT", "SELLER", "ADVISOR", "TRADER"];
export declare class UpdateActiveRolesDto {
    activeRoles: Role[];
}
