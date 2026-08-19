import { IsString, Matches } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class ForgotPasswordStartDto {
  @IsIndianMobile()
  mobile: string;

  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits.' })
  pincode: string;
}
