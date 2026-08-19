import { IsString, MinLength } from 'class-validator';

export class InitiatePhonePePaymentDto {
  @IsString()
  @MinLength(1)
  redirectUrl: string;
}
