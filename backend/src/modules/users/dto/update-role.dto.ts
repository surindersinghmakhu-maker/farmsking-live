import { IsIn } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @IsIn([Role.BUSINESS_PARTNER])
  role: Role;
}
