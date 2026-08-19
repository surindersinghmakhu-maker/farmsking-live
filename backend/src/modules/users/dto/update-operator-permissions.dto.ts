import { IsArray, IsEnum } from 'class-validator';
import { OperatorPermission } from '@prisma/client';

export class UpdateOperatorPermissionsDto {
  @IsArray()
  @IsEnum(OperatorPermission, { each: true })
  permissions: OperatorPermission[];
}
