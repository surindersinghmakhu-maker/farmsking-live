import { IsArray, IsIn } from 'class-validator';
import { Role } from '@prisma/client';

/** The set of roles a checkbox UI is allowed to toggle — staff roles (ADMIN/SUPER_ADMIN/OPERATOR) have their own dedicated creation flows. */
export const ASSIGNABLE_CHECKBOX_ROLES = [Role.CUSTOMER, Role.FARMER, Role.GARDENER, Role.ADVISOR, Role.BUSINESS_PARTNER] as const;

export class UpdateActiveRolesDto {
  /** The full desired set of active roles for this user — anything currently active but missing here gets deactivated (not deleted); anything new gets granted. */
  @IsArray()
  @IsIn(ASSIGNABLE_CHECKBOX_ROLES, { each: true })
  activeRoles: Role[];
}
