import { IsString, IsUUID } from 'class-validator';

export class ApplyCouponToFarmerDto {
  @IsString()
  code: string;

  @IsUUID()
  farmerId: string;
}
