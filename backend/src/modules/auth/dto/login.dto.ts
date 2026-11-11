import { IsIn, IsOptional, IsString } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class LoginDto {
  @IsString()
  mobile: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  captchaToken?: string;

  @IsOptional()
  @IsIn(['CLIENT', 'PARTNER'])
  portal?: 'CLIENT' | 'PARTNER';
}
