import { IsArray, IsEnum } from 'class-validator';
import { SupervisorPermission } from '@prisma/client';

export class UpdateSupervisorPermissionsDto {
  @IsArray()
  @IsEnum(SupervisorPermission, { each: true })
  permissions: SupervisorPermission[];
}
