import { IsArray, IsEnum, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { SupervisorPermission } from '@prisma/client';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class CreateSupervisorDto {
  @IsOptional()
  @IsString()
  firebaseIdToken?: string;

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

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}
