import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';
import { Role } from '@prisma/client';
import { normalizeRoleAlias } from '../../../common/utils/auth-user.util';

export class UpdateRoleDto {
  @Transform(({ value }) => normalizeRoleAlias(value))
  @IsIn([Role.AGENT])
  role: Role;
}
