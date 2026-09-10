import { Role } from '@prisma/client';
export declare const ASSIGNABLE_CHECKBOX_ROLES: readonly ["CUSTOMER", "FARMER", "GARDENER", "ADVISOR", "BUSINESS_PARTNER"];
export declare class UpdateActiveRolesDto {
    activeRoles: Role[];
}
