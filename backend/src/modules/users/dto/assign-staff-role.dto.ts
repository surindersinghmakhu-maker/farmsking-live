import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class AssignStaffRoleDto {
  @IsString()
  userId!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsIn(['FARM', 'GARDEN'])
  advisorType?: 'FARM' | 'GARDEN';
}

