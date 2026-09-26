import { IsArray, IsEnum } from 'class-validator';
import { AdminStaffPermission } from '@prisma/client';

export class UpdateAdminStaffPermissionsDto {
  @IsArray()
  @IsEnum(AdminStaffPermission, { each: true })
  permissions: AdminStaffPermission[];
}
