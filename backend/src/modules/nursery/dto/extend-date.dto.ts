import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExtendDateDto {
  @ApiProperty({ description: 'New proposed delivery date (must be before uprooting deadline and >48h advance)' })
  @IsNotEmpty()
  @IsDateString()
  newDeliveryDate: string;

  @ApiPropertyOptional({ description: 'Reason for date extension (e.g. rain, labor delay, field preparation)' })
  @IsOptional()
  @IsString()
  reason?: string;
}

