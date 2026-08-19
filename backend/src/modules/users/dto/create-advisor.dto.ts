import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AdvisorType } from '@prisma/client';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class CreateAdvisorDto {
  @IsIndianMobile()
  mobile: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsIn(['en', 'hi', 'pa'])
  preferredLanguage?: string;

  @IsIn(['FARM', 'GARDEN'])
  advisorType: AdvisorType;
}
