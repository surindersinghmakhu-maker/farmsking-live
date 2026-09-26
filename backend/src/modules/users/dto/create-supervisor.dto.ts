import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { SupervisorPermission } from '@prisma/client';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class CreateSupervisorDto {
  @IsIndianMobile()
  mobile: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsArray()
  @IsEnum(SupervisorPermission, { each: true })
  @IsOptional()
  permissions?: SupervisorPermission[];
}
