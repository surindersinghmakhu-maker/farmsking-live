import { Role } from '@prisma/client';
export declare const ASSIGNABLE_CHECKBOX_ROLES: readonly ["CUSTOMER", "FARMER", "GARDENER", "ADVISOR", "AGENT", "TECHNICAL_TRAINER", "TRADER"];
export declare class UpdateActiveRolesDto {
    activeRoles: Role[];
}
