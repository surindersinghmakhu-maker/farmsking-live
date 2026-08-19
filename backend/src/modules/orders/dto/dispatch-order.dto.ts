import { IsOptional, IsString, MinLength } from 'class-validator';

export class DispatchOrderDto {
  @IsString()
  @MinLength(1)
  courierName: string;

  @IsOptional()
  @IsString()
  trackingId?: string;
}
