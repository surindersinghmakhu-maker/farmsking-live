import { IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { AdvisorType } from '@prisma/client';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class CreateAssistantDoctorDto {
  @IsIndianMobile()
  mobile: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsNumber()
  doctorConsultationFee?: number;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  profileTitle?: string;

  @IsOptional()
  @IsIn(['FARM', 'GARDEN'])
  advisorType?: AdvisorType;
}
