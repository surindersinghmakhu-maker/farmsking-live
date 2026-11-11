import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Role } from '@prisma/client';
import { normalizeRoleAlias } from '../../../common/utils/auth-user.util';

export class ListUsersQueryDto {
  @IsOptional()
  @Transform(({ value }) => normalizeRoleAlias(value))
  @IsIn(Object.values(Role))
  role?: Role;

  @IsOptional()
  @IsIn(['active', 'inactive', 'all'])
  status?: 'active' | 'inactive' | 'all';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
