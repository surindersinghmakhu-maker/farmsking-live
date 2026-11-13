import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class ConfirmDeliveryDto {
  @ApiProperty({ description: '4-digit delivery verification OTP' })
  @IsNotEmpty()
  @IsString()
  @Length(4, 4, { message: 'Delivery OTP must be exactly 4 digits.' })
  deliveryOtp: string;

  @ApiPropertyOptional({ description: 'Delivery service star rating (1-5)', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryRating?: number;

  @ApiPropertyOptional({ description: 'Plant & root quality star rating (1-5)', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  plantQualityRating?: number;

  @ApiPropertyOptional({ description: 'Review feedback comments' })
  @IsOptional()
  @IsString()
  reviewText?: string;
}

