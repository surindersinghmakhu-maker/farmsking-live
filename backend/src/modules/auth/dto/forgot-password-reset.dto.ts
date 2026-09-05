import { IsString, Matches, MinLength } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class ForgotPasswordResetDto {
  @IsIndianMobile()
  mobile: string;

  @Matches(/^\d{4,6}$/, { message: 'OTP must be 4 to 6 digits.' })
  otp: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters.' })
  newPassword: string;
}
