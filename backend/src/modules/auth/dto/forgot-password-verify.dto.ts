import { IsString, Matches } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class ForgotPasswordVerifyDto {
  @IsIndianMobile()
  mobile: string;

  @Matches(/^\d{4,6}$/, { message: 'OTP must be 4 to 6 digits.' })
  otp: string;
}
