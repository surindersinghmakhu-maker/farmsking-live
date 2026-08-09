import { IsString } from 'class-validator';
import { IsIndianMobile } from '../../../common/validators/is-indian-mobile.validator';

export class LoginDto {
  @IsIndianMobile()
  mobile: string;

  @IsString()
  password: string;
}
